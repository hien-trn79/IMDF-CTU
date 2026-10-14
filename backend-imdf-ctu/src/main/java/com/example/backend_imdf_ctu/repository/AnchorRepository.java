package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Anchor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnchorRepository extends JpaRepository<Anchor, Integer> {
}
