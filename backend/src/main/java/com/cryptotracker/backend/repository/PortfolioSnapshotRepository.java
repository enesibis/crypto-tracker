package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.PortfolioSnapshot;
import com.cryptotracker.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {
    List<PortfolioSnapshot> findByUserOrderByRecordedAtAsc(User user);

    @Query("SELECT COUNT(s) FROM PortfolioSnapshot s WHERE s.user = :user AND s.recordedAt >= :since")
    long countByUserSince(@Param("user") User user, @Param("since") LocalDateTime since);
}
