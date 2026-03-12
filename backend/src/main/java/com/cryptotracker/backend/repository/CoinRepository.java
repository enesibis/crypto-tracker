package com.cryptotracker.backend.repository;

import com.cryptotracker.backend.entity.Coin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoinRepository extends JpaRepository<Coin, String> {

    @EntityGraph(attributePaths = {"price"})
    @Query(value = "SELECT c FROM Coin c JOIN c.price p " +
                   "WHERE (:search = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                   "OR LOWER(c.symbol) LIKE LOWER(CONCAT('%', :search, '%')))",
           countQuery = "SELECT COUNT(c) FROM Coin c JOIN c.price p " +
                        "WHERE (:search = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(c.symbol) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Coin> findCoins(@Param("search") String search, Pageable pageable);
}
