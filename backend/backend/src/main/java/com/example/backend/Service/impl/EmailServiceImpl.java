package com.example.backend.Service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    public void sendRegistrationSuccessEmail(String toEmail, String userName) {
        String subject = "Welcome to DairyFlow";
        String text = "Hi " + (userName == null ? "User" : userName) + ",\n\n"
                + "Your registration on DairyFlow was successful.\n"
                + "You can now log in and start using the platform.\n\n"
                + "Regards,\nDairyFlow Team";
        sendEmail(toEmail, subject, text);
    }

    public void sendPasswordResetOtp(String toEmail, String userName, String otp) {
        String subject = "DairyFlow Password Reset OTP";
        String text = "Hi " + (userName == null ? "User" : userName) + ",\n\n"
                + "Your OTP for password reset is: " + otp + "\n"
                + "This OTP is valid for 10 minutes.\n\n"
                + "If you did not request a password reset, please ignore this email.\n\n"
                + "Regards,\nDairyFlow Team";
        sendEmail(toEmail, subject, text);
    }

    private void sendEmail(String toEmail, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            if (mailFrom != null && !mailFrom.isBlank()) {
                msg.setFrom(mailFrom);
            }
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
