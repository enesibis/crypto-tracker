package com.cryptotracker.backend.service;

import com.cryptotracker.backend.dto.CoinGeckoMarketDto;
import com.cryptotracker.backend.dto.GlobalMarketDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoinGeckoClient {

    private final WebClient coinGeckoWebClient;

    public List<CoinGeckoMarketDto> getTopCoins(int limit) {
        return getCoinsPage(limit, 1);
    }

    @SuppressWarnings("unchecked")
    public GlobalMarketDto getGlobalMarket() {
        log.info("CoinGecko global market verisi çekiliyor...");
        Map<String, Object> response = coinGeckoWebClient.get()
                .uri("/global")
                .retrieve()
                .bodyToMono(Map.class)
                .doOnError(e -> log.error("CoinGecko global API hatası: {}", e.getMessage()))
                .onErrorReturn(Map.of())
                .block();

        if (response == null || !response.containsKey("data")) {
            return new GlobalMarketDto(0, 0, 0, 0);
        }

        Map<String, Object> data = (Map<String, Object>) response.get("data");
        Map<String, Object> totalMarketCap = (Map<String, Object>) data.getOrDefault("total_market_cap", Map.of());
        Map<String, Object> totalVolume = (Map<String, Object>) data.getOrDefault("total_volume", Map.of());
        Map<String, Object> marketCapPct = (Map<String, Object>) data.getOrDefault("market_cap_percentage", Map.of());

        double marketCap = toDouble(totalMarketCap.getOrDefault("usd", 0));
        double volume = toDouble(totalVolume.getOrDefault("usd", 0));
        double btcDom = toDouble(marketCapPct.getOrDefault("btc", 0));
        double change24h = toDouble(data.getOrDefault("market_cap_change_percentage_24h_usd", 0));

        return new GlobalMarketDto(marketCap, volume, btcDom, change24h);
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        return 0;
    }

    public List<CoinGeckoMarketDto> getCoinsPage(int perPage, int page) {
        log.info("CoinGecko API'den sayfa {} çekiliyor (perPage={})...", page, perPage);
        return coinGeckoWebClient.get()
                .uri(uri -> uri
                        .path("/coins/markets")
                        .queryParam("vs_currency", "usd")
                        .queryParam("order", "market_cap_desc")
                        .queryParam("per_page", perPage)
                        .queryParam("page", page)
                        .queryParam("sparkline", false)
                        .build())
                .retrieve()
                .bodyToFlux(CoinGeckoMarketDto.class)
                .collectList()
                .doOnError(e -> log.error("CoinGecko API hatası: {}", e.getMessage()))
                .onErrorReturn(List.of())
                .block();
    }
}
