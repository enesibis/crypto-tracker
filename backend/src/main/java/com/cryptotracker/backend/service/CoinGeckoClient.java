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
        return getCoinsPage(limit, 1);
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
