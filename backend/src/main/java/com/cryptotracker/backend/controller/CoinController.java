package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.CoinDto;
import com.cryptotracker.backend.dto.PagedResponse;
import com.cryptotracker.backend.dto.PriceHistoryDto;
import com.cryptotracker.backend.service.CoinService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coins")
@RequiredArgsConstructor
public class CoinController {

    private final CoinService coinService;

    @GetMapping("/{id}")
    public ResponseEntity<CoinDto> getCoin(@PathVariable String id) {
        return coinService.getCoinById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<PriceHistoryDto>> getHistory(
            @PathVariable String id,
            @RequestParam(defaultValue = "7") int days) {
        days = Math.min(days, 365);
        return ResponseEntity.ok(coinService.getHistory(id, days));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<CoinDto>> getCoins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "marketCapUsd") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        size = Math.min(size, 100);
        return ResponseEntity.ok(coinService.getCoins(page, size, search, sortBy, sortDir));
    }
}
