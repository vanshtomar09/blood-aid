package com.bloodaid.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.bloodaid.dto.Dtos;
import org.junit.jupiter.api.Test;

class FallbackAiTest {

    @Test
    void emergencyMessagesGetOnlyTheEmergencyAdvice() {
        String reply = FallbackAi.chat("I have chest pain and feel faint");

        assertTrue(reply.contains("112"));
        assertTrue(!reply.contains("Minor cut"));
    }

    @Test
    void donationQuestionMentionsEligibilityAndDisclaimer() {
        String reply = FallbackAi.chat("Who can donate blood?");

        assertTrue(reply.contains("18-65"));
        assertTrue(reply.startsWith(FallbackAi.DISCLAIMER));
    }

    @Test
    void unknownQuestionStillGetsADisclaimer() {
        assertTrue(FallbackAi.chat("tell me a story").contains(FallbackAi.DISCLAIMER));
    }

    @Test
    void predictComputesMeanAndRangePerBloodType() {
        String csv = "Date,A+,O-\n2026-01-01,10,30\n2026-02-01,20,40";

        Dtos.PredictResponse res = FallbackAi.predict(new Dtos.PredictRequest(csv, "summer", "marathon"));

        assertEquals("fallback", res.source());
        assertTrue(res.predictedDemand().contains("A+: about 15 units (typical range 8-22)"));
        assertTrue(res.predictedDemand().contains("O-: about 35 units"));
        assertTrue(res.recommendations().contains("O-"));
        assertTrue(res.recommendations().contains("marathon"));
    }

    @Test
    void predictWithoutUsableDataExplainsTheExpectedFormat() {
        Dtos.PredictResponse res = FallbackAi.predict(new Dtos.PredictRequest("hello", "x", "y"));

        assertTrue(res.predictedDemand().startsWith("Not enough data"));
        assertTrue(res.recommendations().contains("Date,A+"));
    }
}
