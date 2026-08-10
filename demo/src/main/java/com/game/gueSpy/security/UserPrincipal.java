package com.game.gueSpy.security;

import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * The authenticated principal stored in the SecurityContext for a request.
 *
 * <p>Carries the database {@code userId} alongside the username so controllers
 * can read the user id straight from the security context (via
 * {@code @AuthenticationPrincipal}) instead of re-parsing the JWT.
 *
 * <p>Implements {@link AuthenticatedPrincipal} so that
 * {@code Authentication#getName()} still returns the username, keeping code
 * that relies on {@code authentication.getName()} (e.g. audit "createdBy"
 * fields) working unchanged.
 */
public record UserPrincipal(Long userId, String username) implements AuthenticatedPrincipal {

    @Override
    public String getName() {
        return username;
    }
}
