package com.cryptotracker.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@RestController
@RequestMapping("/api/prices")
public class PriceStreamController {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/stream")
    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        // İlk bağlantıda ping gönder
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    // CoinGecko scheduler tarafından çağrılır (timestamp ile)
    public void broadcastUpdate() {
        send("prices-updated", Instant.now().toString());
    }

    // Binance WebSocket tarafından çağrılır (fiyat datası ile)
    // prices: symbol → [price, change24h]
    public void broadcastPrices(Map<String, double[]> prices) {
        if (prices.isEmpty()) return;
        try {
            send("prices-updated", objectMapper.writeValueAsString(prices));
        } catch (Exception e) {
            log.error("SSE broadcastPrices hata: {}", e.getMessage());
        }
    }

    private void send(String eventName, String data) {
        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    public void broadcastAlert(String payload) {
        send("alert-triggered", payload);
    }

    public int getConnectedClients() {
        return emitters.size();
    }
}
