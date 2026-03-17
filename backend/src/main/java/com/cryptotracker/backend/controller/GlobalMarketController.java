package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.GlobalMarketDto;
import com.cryptotracker.backend.service.CoinGeckoClient;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class GlobalMarketController {

    private final CoinGeckoClient coinGeckoClient;

    @Cacheable(value = "globalMarket")
    @GetMapping("/global")
    public GlobalMarketDto getGlobalMarket() {
        return coinGeckoClient.getGlobalMarket();
    }
}
