package com.bloodaid.web;

import com.bloodaid.dto.Dtos;
import com.bloodaid.service.ai.AiService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AiController {

    private final AiService ai;

    public AiController(AiService ai) {
        this.ai = ai;
    }

    /** Medical chatbot. Open to everyone, like the original app. */
    @PostMapping("/chat")
    public Dtos.ChatResponse chat(@Valid @RequestBody Dtos.ChatRequest request) {
        return ai.chat(request);
    }

    /** Blood demand forecast. Staff and admins only (enforced in SecurityConfig). */
    @PostMapping("/predict")
    public Dtos.PredictResponse predict(@Valid @RequestBody Dtos.PredictRequest request) {
        return ai.predict(request);
    }
}
