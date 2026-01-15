package com.game.gueSpy.dto.response;

import java.util.List;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.entity.Category;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper=true)
@AllArgsConstructor
public class CategoryResponse extends GenericResponse{
    private List<Category> categories;
    
}
