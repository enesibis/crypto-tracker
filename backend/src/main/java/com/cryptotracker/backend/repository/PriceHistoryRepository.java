package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.coin.id = :coinId AND ph.recordedAt >= :since ORDER BY ph.recordedAt ASC")
    List<PriceHistory> findByCoinIdAndRecordedAtAfter(String coinId, LocalDateTime since);
}
