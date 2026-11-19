package com.bloodaid.service;

import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

/**
 * Sends plain-text email over SMTP. Configured with the app.mail.* settings (MAIL_HOST, MAIL_PORT,
 * MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM). With no MAIL_HOST it is "not configured" and send() must not be called.
 */
@Service
public class EmailSender {

    private final JavaMailSenderImpl mailer;
    private final String from;

    public EmailSender(@Value("${app.mail.host:}") String host,
                       @Value("${app.mail.port:587}") int port,
                       @Value("${app.mail.username:}") String username,
                       @Value("${app.mail.password:}") String password,
                       @Value("${app.mail.from:}") String from) {
        String cleanHost = host == null ? "" : host.trim();
        String cleanUser = username == null ? "" : username.trim();
        if (cleanHost.isEmpty()) {
            this.mailer = null;
            this.from = "";
        } else {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(cleanHost);
            sender.setPort(port);
            boolean useAuth = !cleanUser.isEmpty();
            if (useAuth) {
                sender.setUsername(cleanUser);
                // Gmail shows app passwords in groups separated by spaces; the spaces are not part of the password.
                sender.setPassword(password == null ? "" : password.replaceAll("\\s+", ""));
            }
            Properties props = sender.getJavaMailProperties();
            props.put("mail.smtp.auth", String.valueOf(useAuth));
            if (port == 465) {
                props.put("mail.smtp.ssl.enable", "true");
            } else {
                props.put("mail.smtp.starttls.enable", "true");
            }
            props.put("mail.smtp.connectiontimeout", "8000");
            props.put("mail.smtp.timeout", "8000");
            props.put("mail.smtp.writetimeout", "8000");
            this.mailer = sender;
            String cleanFrom = from == null ? "" : from.trim();
            this.from = cleanFrom.isEmpty() ? cleanUser : cleanFrom;
        }
    }

    public boolean isConfigured() {
        return mailer != null;
    }

    public void send(String to, String subject, String text) {
        if (mailer == null) {
            throw new IllegalStateException("Email delivery is not configured.");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        if (!from.isEmpty()) {
            message.setFrom(from);
        }
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailer.send(message);
    }
}
