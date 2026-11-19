package com.bloodaid.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Minimal client for the Gemini generateContent REST API. The API key is sent in a header, never logged. */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    public record Turn(String role, String text) {
    }

    private final ObjectMapper mapper;
    private final HttpClient http;
    private final String apiKey;
    private final String model;

    public GeminiClient(ObjectMapper mapper,
                        @Value("${gemini.api-key:}") String apiKey,
                        @Value("${gemini.model:gemini-2.5-flash}") String model) {
        this.mapper = mapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    /** Plain-text generation. Turns must alternate starting with role "user"; roles are "user" or "model". */
    public String generateText(String systemPrompt, List<Turn> turns) throws IOException, InterruptedException {
        ObjectNode body = baseBody(systemPrompt, turns);
        return extractText(send(body));
    }

    /** Generation constrained to JSON matching a simple schema of string properties. */
    public JsonNode generateJson(String systemPrompt, String userPrompt, List<String> stringFields)
            throws IOException, InterruptedException {
        ObjectNode body = baseBody(systemPrompt, List.of(new Turn("user", userPrompt)));

        ObjectNode schemaProps = mapper.createObjectNode();
        ArrayNode required = mapper.createArrayNode();
        for (String field : stringFields) {
            schemaProps.putObject(field).put("type", "STRING");
            required.add(field);
        }
        ObjectNode generationConfig = body.putObject("generationConfig");
        generationConfig.put("responseMimeType", "application/json");
        ObjectNode schema = generationConfig.putObject("responseSchema");
        schema.put("type", "OBJECT");
        schema.set("properties", schemaProps);
        schema.set("required", required);

        String text = extractText(send(body));
        return mapper.readTree(text);
    }

    // ---------------------------------------------------------------- internals

    private ObjectNode baseBody(String systemPrompt, List<Turn> turns) {
        ObjectNode body = mapper.createObjectNode();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            ObjectNode system = body.putObject("systemInstruction");
            system.putArray("parts").addObject().put("text", systemPrompt);
        }
        ArrayNode contents = body.putArray("contents");
        for (Turn turn : turns) {
            ObjectNode c = contents.addObject();
            c.put("role", turn.role());
            c.putArray("parts").addObject().put("text", turn.text());
        }
        return body;
    }

    private JsonNode send(ObjectNode body) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + model + ":generateContent"))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            log.warn("Gemini API returned HTTP {}", response.statusCode());
            throw new IOException("Gemini API returned HTTP " + response.statusCode());
        }
        return mapper.readTree(response.body());
    }

    private static String extractText(JsonNode root) throws IOException {
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        StringBuilder sb = new StringBuilder();
        if (parts.isArray()) {
            for (JsonNode part : parts) {
                if (part.hasNonNull("text")) {
                    sb.append(part.get("text").asText());
                }
            }
        }
        String text = sb.toString().trim();
        if (text.isEmpty()) {
            throw new IOException("Gemini returned no text (possibly blocked by safety filters)");
        }
        return text;
    }
}
