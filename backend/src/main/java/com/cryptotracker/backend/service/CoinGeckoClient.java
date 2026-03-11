package com.cryptotracker.backend.service;

import com.cryptotracker.backend.dto.CoinGeckoMarketDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoinGeckoClient {

    private final WebClient coinGeckoWebClient;

    public List<CoinGeckoMarketDto> getTopCoins(int limit) {
        log.info("CoinGecko API'den top {} coin çekiliyor...", limit);
        return coinGeckoWebClient.get()
                .uri(uri -> uri
                        .path("/coins/markets")
                        .queryParam("vs_currency", "usd")
                        .queryParam("order", "market_cap_desc")
                        .queryParam("per_page", limit)
                        .queryParam("page", 1)
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
