package com.game.gueSpy.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppConfigRequest {
    @NotBlank
    private String key;

    // value is only required on create; the update flow allows it to be absent.
    private String value;
}