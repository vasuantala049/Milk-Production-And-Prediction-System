package com.example.backend.Config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Validation errors (@Valid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors()
                .forEach(error ->
                        errors.put(error.getField(), error.getDefaultMessage())
                );

        log.warn("Validation error: {}", errors);

        Map<String, Object> response = baseResponse(HttpStatus.BAD_REQUEST, request);
        response.put("errors", errors);

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Bad request errors
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {

        log.warn("IllegalArgumentException: {}", ex.getMessage());

        return new ResponseEntity<>(
                buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, request),
                HttpStatus.BAD_REQUEST
        );
    }

    /**
     * Conflict errors (business logic like already milked)
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request
    ) {

        log.warn("IllegalStateException: {}", ex.getMessage());

        return new ResponseEntity<>(
                buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, request),
                HttpStatus.CONFLICT
        );
    }

    /**
     * Runtime errors (fallback for business logic)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex,
            HttpServletRequest request
    ) {

        log.error("RuntimeException: {}", ex.getMessage());

        return new ResponseEntity<>(
                buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, request),
                HttpStatus.BAD_REQUEST
        );
    }

    /**
     * Unexpected system errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {

        log.error("Unexpected error", ex);

        return new ResponseEntity<>(
                buildErrorResponse("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR, request),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    /**
     * Helper to create base response
     */
    private Map<String, Object> baseResponse(HttpStatus status, HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", status.getReasonPhrase());
        response.put("path", request.getRequestURI());

        return response;
    }

    /**
     * Helper to create error response
     */
    private Map<String, Object> buildErrorResponse(
            String message,
            HttpStatus status,
            HttpServletRequest request
    ) {

        Map<String, Object> response = baseResponse(status, request);
        response.put("message", message);

        return response;
    }
}