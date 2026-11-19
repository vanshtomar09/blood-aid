package com.bloodaid.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.bloodaid.dto.Dtos;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class AiServiceTest {

    @Test
    void withoutAnApiKeyTheServiceUsesTheFallback() {
        AiService service = new AiService(new GeminiClient(new ObjectMapper(), "", "gemini-test"));

        assertFalse(service.isAiEnabled());
        Dtos.ChatResponse reply = service.chat(new Dtos.ChatRequest("Who can donate blood?", List.of()));
        assertEquals("fallback", reply.source());
    }

    @Test
    void turnsStartWithUserAlternateAndEndWithTheNewMessage() {
        List<Dtos.ChatTurn> history = List.of(
                new Dtos.ChatTurn("model", "Hi! I am the assistant."),
                new Dtos.ChatTurn("user", "q1"),
                new Dtos.ChatTurn("model", "a1"),
                new Dtos.ChatTurn("user", "dangling question"));

        List<GeminiClient.Turn> turns = AiService.buildTurns(new Dtos.ChatRequest("q2", history));

        assertEquals(3, turns.size());
        assertEquals("user", turns.get(0).role());
        assertEquals("q1", turns.get(0).text());
        assertEquals("model", turns.get(1).role());
        assertEquals("user", turns.get(2).role());
        assertEquals("q2", turns.get(2).text());
    }

    @Test
    void missingHistoryIsFine() {
        List<GeminiClient.Turn> turns = AiService.buildTurns(new Dtos.ChatRequest("hello", null));

        assertEquals(1, turns.size());
        assertEquals("hello", turns.get(0).text());
    }
}
