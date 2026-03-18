package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.PriceAlert;
import com.cryptotracker.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceAlertRepository extends JpaRepository<PriceAlert, Long> {
    List<PriceAlert> findByUser(User user);
    List<PriceAlert> findByTriggeredFalse();
}
