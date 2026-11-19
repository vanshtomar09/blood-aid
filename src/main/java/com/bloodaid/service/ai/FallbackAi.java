package com.bloodaid.service.ai;

import com.bloodaid.domain.BloodTypes;
import com.bloodaid.dto.Dtos;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Answers used when no GEMINI_API_KEY is configured (or the Gemini call fails).
 * These are plain rules and simple statistics, not AI.
 */
public final class FallbackAi {

    public static final String DISCLAIMER =
            "As an AI assistant, I am not qualified to give medical advice. The information I provide is for general "
                    + "guidance only. Please consult a qualified healthcare professional for any health concerns. "
                    + "If this is an emergency, please call your local emergency number immediately.";

    private FallbackAi() {
    }

    // ---------------------------------------------------------------- chat

    public static String chat(String message) {
        String m = message == null ? "" : message.toLowerCase(Locale.ROOT);

        if (containsAny(m, "unconscious", "chest pain", "severe bleeding", "heart attack", "stroke",
                "can't breathe", "cannot breathe", "not breathing", "overdose")) {
            return "This sounds like a possible emergency. Please call your local emergency number right now "
                    + "(112 in India) or go to the nearest emergency room. Do not wait for an online answer.";
        }
        if (containsAny(m, "eligib", "can i donate", "who can donate", "how do i donate", "donate blood", "donation")) {
            return DISCLAIMER + "\n\n**Donating blood**\n"
                    + "- Age 18-65, weight above 50 kg, and in good health.\n"
                    + "- Whole blood can be donated every 3 months.\n"
                    + "- Before: eat a healthy meal and drink plenty of water.\n"
                    + "- After: rest a little, have refreshments, and avoid strenuous activity for the day.\n"
                    + "Register as a donor from the Register page to get started.";
        }
        if (containsAny(m, "compatib", "universal", "which blood", "blood type can")) {
            return "**Blood type compatibility (red cells)**\n"
                    + "- O- can donate to everyone (universal donor).\n"
                    + "- AB+ can receive from everyone (universal recipient).\n"
                    + "- A+ receives from A+, A-, O+, O-.\n"
                    + "- A- receives from A-, O-.\n"
                    + "- B+ receives from B+, B-, O+, O-.\n"
                    + "- B- receives from B-, O-.\n"
                    + "- AB- receives from AB-, A-, B-, O-.\n"
                    + "- O+ receives from O+, O-.\n"
                    + "- O- receives from O- only.";
        }
        if (containsAny(m, "hospital", "nearby", "near me", "blood bank", "find blood")) {
            return "I can't search for hospitals automatically. Open the Map page to see blood banks near you, "
                    + "or use the search box at the top to look up a bank, a city or a blood type. "
                    + "To ask for blood, use Request Blood in the menu.";
        }
        if (containsAny(m, "anemia", "anaemia", "hemoglobin", "haemoglobin", "iron")) {
            return DISCLAIMER + "\n\n**Low hemoglobin (anemia)** can cause tiredness, pale skin and dizziness. "
                    + "Iron-rich foods such as spinach, beetroot, lentils and pomegranate can help, and vitamin C "
                    + "helps the body absorb iron. A doctor can check the cause with a simple blood test.";
        }
        if (containsAny(m, "cut", "wound", "bleed", "nosebleed", "faint")) {
            return DISCLAIMER + "\n\n**Minor cut first aid**\n"
                    + "1. Wash your hands.\n"
                    + "2. Press gently with a clean cloth to stop the bleeding.\n"
                    + "3. Rinse the wound with clean water.\n"
                    + "4. Apply antiseptic and cover with a bandage.\n"
                    + "Deep cuts, or bleeding that does not stop, need a doctor right away.";
        }
        return "Hi! I'm the BloodAid assistant, currently running in basic mode (no AI key is configured on this "
                + "server). I can explain who can donate blood, blood type compatibility, and basic first aid. "
                + "Try one of the suggestions below.\n\n" + DISCLAIMER;
    }

    // ------------------------------------------------------------ forecast

    /** Simple statistics over the pasted CSV: average per blood type with a one-standard-deviation range. */
    public static Dtos.PredictResponse predict(Dtos.PredictRequest request) {
        List<String> lines = new ArrayList<>();
        for (String line : request.historicalData().split("\\R")) {
            if (!line.isBlank()) {
                lines.add(line.trim());
            }
        }
        if (lines.size() < 2) {
            return notEnoughData();
        }

        String[] header = lines.get(0).split(",");
        Map<Integer, String> columnType = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            String name = header[i].trim().toUpperCase(Locale.ROOT);
            if (BloodTypes.ALL.contains(name)) {
                columnType.put(i, name);
            }
        }
        if (columnType.isEmpty()) {
            return notEnoughData();
        }

        Map<String, List<Double>> values = new HashMap<>();
        for (int row = 1; row < lines.size(); row++) {
            String[] cells = lines.get(row).split(",");
            for (Map.Entry<Integer, String> col : columnType.entrySet()) {
                if (col.getKey() < cells.length) {
                    try {
                        double v = Double.parseDouble(cells[col.getKey()].trim());
                        if (v >= 0) {
                            values.computeIfAbsent(col.getValue(), k -> new ArrayList<>()).add(v);
                        }
                    } catch (NumberFormatException ignored) {
                        // skip cells that are not numbers
                    }
                }
            }
        }
        if (values.isEmpty()) {
            return notEnoughData();
        }

        StringBuilder demand = new StringBuilder();
        String topType = null;
        double topMean = -1;
        for (String type : BloodTypes.ALL) {
            List<Double> list = values.get(type);
            if (list == null || list.isEmpty()) {
                continue;
            }
            double mean = mean(list);
            double sd = stdDev(list, mean);
            long low = Math.max(0, Math.round(mean - sd));
            long high = Math.round(mean + sd);
            demand.append(type).append(": about ").append(Math.round(mean)).append(" units (typical range ")
                    .append(low).append("-").append(high).append(")\n");
            if (mean > topMean) {
                topMean = mean;
                topType = type;
            }
        }
        demand.append("\nBased on the average of ").append(lines.size() - 1)
                .append(" row(s) you provided. The range is plus or minus one standard deviation. ")
                .append("This is a basic statistical estimate, not an AI forecast.");

        StringBuilder rec = new StringBuilder();
        rec.append("- Keep the most stock of ").append(topType).append(", which has the highest average demand.\n");
        rec.append("- Keep a safety buffer of roughly 20% above the averages for the rarer types (AB-, B-, O-).\n");
        if (!request.localEvents().isBlank()) {
            rec.append("- Review upcoming events (\"").append(shorten(request.localEvents()))
                    .append("\") and raise stock ahead of them.\n");
        }
        if (!request.seasonality().isBlank()) {
            rec.append("- Adjust for the seasonal pattern you described (\"").append(shorten(request.seasonality()))
                    .append("\").\n");
        }
        rec.append("- Add a GEMINI_API_KEY on the server for a richer AI-written forecast.");

        return new Dtos.PredictResponse(demand.toString().trim(), rec.toString().trim(), "fallback");
    }

    // -------------------------------------------------------------- helpers

    private static Dtos.PredictResponse notEnoughData() {
        return new Dtos.PredictResponse(
                "Not enough data to estimate demand.",
                "Paste CSV with a header row of blood types and one row per period, for example:\n"
                        + "Date,A+,A-,B+,B-,AB+,AB-,O+,O-\n2026-01-01,10,5,8,3,2,1,14,6",
                "fallback");
    }

    private static boolean containsAny(String text, String... needles) {
        for (String n : needles) {
            if (text.contains(n)) {
                return true;
            }
        }
        return false;
    }

    private static double mean(List<Double> list) {
        double sum = 0;
        for (double v : list) {
            sum += v;
        }
        return sum / list.size();
    }

    private static double stdDev(List<Double> list, double mean) {
        if (list.size() < 2) {
            return 0;
        }
        double sum = 0;
        for (double v : list) {
            sum += (v - mean) * (v - mean);
        }
        return Math.sqrt(sum / (list.size() - 1));
    }

    private static String shorten(String s) {
        String t = s.trim().replaceAll("\\s+", " ");
        return t.length() > 80 ? t.substring(0, 77) + "..." : t;
    }
}
