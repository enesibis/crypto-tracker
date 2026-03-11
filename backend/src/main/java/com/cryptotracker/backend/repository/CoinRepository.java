package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.Coin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CoinRepository extends JpaRepository<Coin, String> {

    @Query("SELECT c FROM Coin c JOIN FETCH c.price ORDER BY c.price.marketCapUsd DESC NULLS LAST")
    List<Coin> findAllWithPriceOrderByMarketCap();
}
