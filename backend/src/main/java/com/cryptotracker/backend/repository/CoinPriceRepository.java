package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.CoinPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CoinPriceRepository extends JpaRepository<CoinPrice, Long> {
    Optional<CoinPrice> findByCoinId(String coinId);
}
