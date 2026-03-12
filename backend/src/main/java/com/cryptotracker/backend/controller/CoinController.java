package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.CoinDto;
import com.cryptotracker.backend.dto.PagedResponse;
import com.cryptotracker.backend.service.CoinService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coins")
@RequiredArgsConstructor
public class CoinController {

    private final CoinService coinService;

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
