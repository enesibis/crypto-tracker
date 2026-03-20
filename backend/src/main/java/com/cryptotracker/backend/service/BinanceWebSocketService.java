package com.cryptotracker.backend.service;

import com.cryptotracker.backend.controller.PriceStreamController;
import com.cryptotracker.backend.repository.CoinRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class BinanceWebSocketService {

    private final CoinRepository coinRepository;
    private final CoinService coinService;
    private final PriceStreamController priceStreamController;
    private final AlertCheckService alertCheckService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, BigDecimal[]> pendingUpdates = new ConcurrentHashMap<>();

    private volatile WebSocket webSocket;
    private volatile boolean running = false;

    @PostConstruct
    public void init() {
        // İlk CoinGecko fetch'inden sonra başlat (yaklaşık 35s)
        CompletableFuture.delayedExecutor(35, TimeUnit.SECONDS).execute(this::connect);
    }

    /** CoinGecko scheduler yeni coin listesi aldıktan sonra çağırır */
    public void reconnect() {
        disconnect();
        CompletableFuture.delayedExecutor(3, TimeUnit.SECONDS).execute(this::connect);
    }

    private void connect() {
        try {
            List<String> streams = coinRepository.findAll().stream()
                    .map(c -> c.getSymbol().toLowerCase() + "usdt@ticker")
                    .limit(200)
                    .toList();

            if (streams.isEmpty()) {
                log.warn("Binance: DB'de coin yok, 60s sonra tekrar denenecek.");
                CompletableFuture.delayedExecutor(60, TimeUnit.SECONDS).execute(this::connect);
                return;
            }

            String streamParam = String.join("/", streams);
            String url = "wss://stream.binance.com:9443/stream?streams=" + streamParam;

            running = true;
            HttpClient client = HttpClient.newHttpClient();
            webSocket = client.newWebSocketBuilder()
                    .buildAsync(URI.create(url), new BinanceListener())
                    .join();

            log.info("Binance WebSocket bağlandı. {} sembol izleniyor.", streams.size());

        } catch (Exception e) {
            log.error("Binance WebSocket bağlantı hatası: {}", e.getMessage());
            if (running) {
                CompletableFuture.delayedExecutor(15, TimeUnit.SECONDS).execute(this::connect);
            }
        }
    }

    @PreDestroy
    public void disconnect() {
        running = false;
        if (webSocket != null) {
            try {
                webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "shutdown").join();
            } catch (Exception ignored) {}
        }
    }

    private int flushCounter = 0;
    private static final int HISTORY_INTERVAL = 30; // 30 × 2s = 60s

    /** Her 2 saniyede bir bekleyen fiyatları DB'ye yaz, SSE'ye yayınla */
    @Scheduled(fixedRate = 2000)
    public void flushUpdates() {
        if (pendingUpdates.isEmpty()) return;

        Map<String, BigDecimal[]> snapshot = new ConcurrentHashMap<>(pendingUpdates);
        pendingUpdates.clear();
        flushCounter++;

        boolean storeHistory = (flushCounter % HISTORY_INTERVAL == 0);
        Map<String, double[]> updated = coinService.bulkUpdatePricesFromBinance(snapshot, storeHistory);
        if (!updated.isEmpty()) {
            priceStreamController.broadcastPrices(updated);
            alertCheckService.checkAlerts();
        }
    }

    @SuppressWarnings("unchecked")
    private void handleMessage(String message) {
        try {
            Map<String, Object> wrapper = objectMapper.readValue(message, Map.class);
            Map<String, Object> data = (Map<String, Object>) wrapper.get("data");
            if (data == null) return;

            String binanceSymbol = (String) data.get("s"); // ör: "BTCUSDT"
            if (binanceSymbol == null || !binanceSymbol.endsWith("USDT")) return;

            // "BTCUSDT" → "btc"
            String symbol = binanceSymbol.substring(0, binanceSymbol.length() - 4).toLowerCase();

            String closeStr  = (String) data.get("c"); // current price
            String changeStr = (String) data.get("P"); // price change %
            String volumeStr = (String) data.get("q"); // quote volume (USDT)

            if (closeStr == null) return;

            pendingUpdates.put(symbol, new BigDecimal[]{
                    new BigDecimal(closeStr),
                    changeStr != null ? new BigDecimal(changeStr) : null,
                    volumeStr != null ? new BigDecimal(volumeStr) : null
            });

        } catch (Exception e) {
            log.debug("Binance mesaj parse hatası: {}", e.getMessage());
        }
    }

    private class BinanceListener implements WebSocket.Listener {
        private final StringBuilder buffer = new StringBuilder();

        @Override
        public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
            buffer.append(data);
            if (last) {
                handleMessage(buffer.toString());
                buffer.setLength(0);
            }
            ws.request(1);
            return null;
        }

        @Override
        public void onError(WebSocket ws, Throwable error) {
            log.warn("Binance WebSocket hata: {}. Yeniden bağlanılıyor...", error.getMessage());
            if (running) {
                CompletableFuture.delayedExecutor(10, TimeUnit.SECONDS).execute(() -> connect());
            }
        }

        @Override
        public CompletionStage<?> onClose(WebSocket ws, int statusCode, String reason) {
            log.warn("Binance WebSocket kapandı ({}: {}). Yeniden bağlanılıyor...", statusCode, reason);
            if (running) {
                CompletableFuture.delayedExecutor(5, TimeUnit.SECONDS).execute(() -> connect());
            }
            return null;
        }
    }
}
