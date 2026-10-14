package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends JpaRepository<Address, Integer> {
}

