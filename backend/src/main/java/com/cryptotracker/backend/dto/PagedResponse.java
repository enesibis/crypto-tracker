package com.cryptotracker.backend.dto;

import java.io.Serializable;
import java.util.List;

public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) implements Serializable {}
