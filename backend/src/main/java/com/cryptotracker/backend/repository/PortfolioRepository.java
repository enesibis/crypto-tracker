package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.PortfolioEntry;
import com.cryptotracker.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<PortfolioEntry, Long> {
    List<PortfolioEntry> findByUser(User user);
    Optional<PortfolioEntry> findByUserAndCoinId(User user, String coinId);
    void deleteByUserAndCoinId(User user, String coinId);
}
