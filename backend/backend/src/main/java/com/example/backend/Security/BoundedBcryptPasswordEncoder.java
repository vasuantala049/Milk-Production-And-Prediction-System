package com.example.backend.Security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.concurrent.Semaphore;

/**
 * Keeps bcrypt as the hashing algorithm while limiting concurrent CPU-heavy
 * hash operations to prevent auth endpoints from stalling under burst traffic.
 */
public class BoundedBcryptPasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder delegate;
    private final Semaphore concurrencyLimiter;

    public BoundedBcryptPasswordEncoder(int strength, int maxConcurrentHashes) {
        this.delegate = new BCryptPasswordEncoder(strength);
        this.concurrencyLimiter = new Semaphore(Math.max(1, maxConcurrentHashes), true);
    }

    @Override
    public String encode(CharSequence rawPassword) {
        acquirePermit();
        try {
            return delegate.encode(rawPassword);
        } finally {
            concurrencyLimiter.release();
        }
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        acquirePermit();
        try {
            return delegate.matches(rawPassword, encodedPassword);
        } finally {
            concurrencyLimiter.release();
        }
    }

    private void acquirePermit() {
        try {
            concurrencyLimiter.acquire();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for password hash slot", ex);
        }
    }
}
