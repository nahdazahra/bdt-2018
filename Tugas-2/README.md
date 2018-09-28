# Fragmentasi pada MySQL Menggunakan Partisi Horizontal

## Table of Contents

## Deskripsi server
- Sistem operasi  : Linux Mint 18.3 Cinnamon 64-bit
- Versi MySQL     : 5.7.23
- RAM             : 4 GB
- CPU             : 4 cores

## Implementasi Partisi 1: Sakila DB

### Deskripsi dataset
- Dataset terdiri dari 23 tabel.
- Masing-masing tabel memiliki jumlah baris data sebagai berikut

    | TABLE_NAME                 | TABLE_ROWS |
    |:---------------------------|-----------:|
    | payment                    |      16049 |
    | rental                     |      16045 |
    | film_actor                 |       5462 |
    | inventory                  |       4581 |
    | film_text                  |       1000 |
    | film_category              |       1000 |
    | film                       |       1000 |
    | address                    |        603 |
    | city                       |        600 |
    | customer                   |        599 |
    | actor                      |        200 |
    | country                    |        109 |
    | category                   |         16 |
    | language                   |          6 |
    | store                      |          2 |
    | staff                      |          2 |
    | staff_list                 |       NULL |
    | actor_info                 |       NULL |
    | sales_by_store             |       NULL |
    | film_list                  |       NULL |
    | sales_by_film_category     |       NULL |
    | customer_list              |       NULL |
    | nicer_but_slower_film_list |       NULL |


### Proses pembuatan partisi
**Step 1** - Pemilihan tabel yang akan dipartisi.

Berdasarkan distribusi data yang terdapat dalam tabel pada database tersebut kita dapat melakukan partisi pada tabel yang mempunyai data paling banyak untuk mempersingkat waktu query, yaitu **payment** dan **rental**.

**Step 2** - Daftar tabel yang akan dipartisi
* Table **payment**
    * Partisi menggunakan metode `HASH`, dimana MySQL akan menyimpan berdasarkan `payment_id` pada tabel `payment`. Pada kasus ini, tabel akan dipartisi menjadi 7 bagian, maka MySQL akan menyimpan data berdasarkan `payment_id` modulus 7 pada setiap partisinya.
    * Nama dari partisi-partisinya adalah :
        1. p0, untuk data dengan `payment_id` mod 7 = 0
        2. p1, untuk data dengan `payment_id` mod 7 = 1
        3. p2, untuk data dengan `payment_id` mod 7 = 2
        4. p3, untuk data dengan `payment_id` mod 7 = 3
        5. p4, untuk data dengan `payment_id` mod 7 = 4
        6. p5, untuk data dengan `payment_id` mod 7 = 5
        7. p6, untuk data dengan `payment_id` mod 7 = 6

* Table **rental**
    * Predikat yang akan digunakan yaitu berdasarkan kolom `rental_date` dengan ketentuan partisi dibagi berdasarkan bulannya.
    * Partisi menggunakan metode `RANGE` untuk setiap bulan.
    * Berdasarkan predikat di atas, maka tabel `rental` akan terbagi menjadi 12 bagian.
    * Nama dari partisi-partisinya adalah :
        1. p01, untuk data dengan `rental_date` = 1
        2. p02, untuk data dengan `rental_date` = 2
        3. p03, untuk data dengan `rental_date` = 3
        4. p04, untuk data dengan `rental_date` = 4
        5. p05, untuk data dengan `rental_date` = 5
        6. p06, untuk data dengan `rental_date` = 6
        7. p07, untuk data dengan `rental_date` = 7
        8. p08, untuk data dengan `rental_date` = 8
        9. p09, untuk data dengan `rental_date` = 9
        10. p10, untuk data dengan `rental_date` = 10
        11. p11, untuk data dengan `rental_date` = 11
        12. p12, untuk data dengan `rental_date` = 12

### Implementasi Partisi
* Script SQL untuk membuat partisi table `payment` dengan metode `HASH`

    ```mysql
    CREATE TABLE payment (
    payment_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id SMALLINT UNSIGNED NOT NULL,
    staff_id TINYINT UNSIGNED NOT NULL,
    rental_id INT DEFAULT NULL,
    amount DECIMAL(5,2) NOT NULL,
    payment_date DATETIME NOT NULL,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY  (payment_id),
    UNIQUE KEY `payment_id` (`payment_id`),
    KEY idx_fk_staff_id (staff_id),
    KEY idx_fk_customer_id (customer_id)
    -- CONSTRAINT fk_payment_rental FOREIGN KEY (rental_id) REFERENCES rental (rental_id) ON DELETE SET NULL ON UPDATE CASCADE,
    -- CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- CONSTRAINT fk_payment_staff FOREIGN KEY (staff_id) REFERENCES staff (staff_id) ON DELETE RESTRICT ON UPDATE CASCADE
    )ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ALTER TABLE payment
        PARTITION BY HASH(payment_id)
        PARTITIONS 7;
    ```

* Script SQL untuk membuat partisi table `payment` dengan metode `HASH`

    ```mysql
    CREATE TABLE rental (
    rental_id INT NOT NULL AUTO_INCREMENT,
    rental_date DATETIME NOT NULL,
    inventory_id MEDIUMINT UNSIGNED NOT NULL,
    customer_id SMALLINT UNSIGNED NOT NULL,
    return_date DATETIME DEFAULT NULL,
    staff_id TINYINT UNSIGNED NOT NULL,
    last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rental_id, rental_date),
    UNIQUE KEY  (rental_date,inventory_id,customer_id),
    KEY idx_fk_inventory_id (inventory_id),
    KEY idx_fk_customer_id (customer_id),
    KEY idx_fk_staff_id (staff_id)
    -- CONSTRAINT fk_rental_staff FOREIGN KEY (staff_id) REFERENCES staff (staff_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- CONSTRAINT fk_rental_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- CONSTRAINT fk_rental_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id) ON DELETE RESTRICT ON UPDATE CASCADE
    )ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ALTER TABLE rental
    PARTITION BY RANGE (MONTH(rental_date))
    (
        PARTITION p01 VALUES LESS THAN (02) ENGINE = InnoDB,
        PARTITION p02 VALUES LESS THAN (03) ENGINE = InnoDB,
        PARTITION p03 VALUES LESS THAN (04) ENGINE = InnoDB,
        PARTITION p04 VALUES LESS THAN (05) ENGINE = InnoDB,
        PARTITION p05 VALUES LESS THAN (06) ENGINE = InnoDB,
        PARTITION p06 VALUES LESS THAN (07) ENGINE = InnoDB,
        PARTITION p07 VALUES LESS THAN (08) ENGINE = InnoDB,
        PARTITION p08 VALUES LESS THAN (09) ENGINE = InnoDB,
        PARTITION p09 VALUES LESS THAN (10) ENGINE = InnoDB,
        PARTITION p10 VALUES LESS THAN (11) ENGINE = InnoDB,
        PARTITION p11 VALUES LESS THAN (12) ENGINE = InnoDB,
        PARTITION p12 VALUES LESS THAN (13) ENGINE = InnoDB,
        PARTITION pmaxval VALUES LESS THAN MAXVALUE ENGINE = InnoDB
    );
    ```

**Catatan :**
> Ketika melakukan partisi pada sebuah tabel, tidak dapat menggunakan `FOREIGN KEY`, maka deklarasi `FOREIGN KEY` pada waktu membuat table tidak dieksekusi.

> `PRIMARY KEY` harus tetap tercantum pada setiap tabel partisi. Jika partisi yang dilakukan tidak menggunakan `PRIMARY KEY` tabel tersebut, atribut (kolom) yang dijadikan parameter untuk predikat harus menjadi `PRIMARY KEY` tabel tersebut.

### Benchmarking
**Step 1** - Periksa tabel yang dipartisi menggunakan query `EXPLAIN`.

```EXPLAIN SELECT COUNT(*) FROM payment;```

**Step 2** - Lakukan verifikasi partisi dengan pengujian menggunakan query `INSERT`.
```mysql
-- insert data to PARTITION p6
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16050, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16057, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16064, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16071, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16078, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16085, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16092, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16099, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16106, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16113, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");

-- insert data to PARTITION p5
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16056, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16063, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16070, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16077, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16084, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16091, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16098, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16105, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16112, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16119, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");

-- insert data to PARTITION p4
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16055, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16062, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16069, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16076, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16083, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16090, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16097, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16104, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16111, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16118, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");

-- insert data to PARTITION p3
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16054, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16061, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16068, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16075, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16082, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16089, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16096, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16103, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16110, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16117, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");

-- insert data to PARTITION p2
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16053, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16060, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16067, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16074, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16081, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16088, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16095, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16102, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16109, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16116, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");

-- insert data to PARTITION p1
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16052, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16059, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16066, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16073, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16080, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16087, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16094, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16101, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16108, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16115, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");

-- insert data to PARTITION p0
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16051, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16058, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16065, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16072, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16079, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16086, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16093, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16100, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16107, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
INSERT INTO `payment` (`payment_id`, `customer_id`, `staff_id`, `rental_id`, `amount`, `payment_date`, `last_update`) VALUES (16114, "599", "1", "14599", "4.99", "2005-08-21 17:43:42", "2006-02-15 22:24:12");
```

**Step 3** - Periksa dengan menggunakan query select 
```mysql
-- menjalankan query ke tabel partisi data yang benar
SELECT * FROM payment PARTITION (p6) WHERE payment_id = 16057;

-- menjalankan query ke tabel partisi data yang salah
SELECT * FROM payment PARTITION (p5) WHERE payment_id = 16057;
```

![Benchmarking Sakila](/Tugas-2/images/benchmark_sakila.png)

## Implementasi Partisi 2: measures dataset

### Deskripsi dataset
- Dataset terdiri dari 2 tabel.
- Masing-masing tabel memiliki jumlah baris data sebagai berikut

    | TABLE_NAME           | TABLE_ROWS |
    |----------------------|------------|
    | partitioned_measures |    1837729 |
    | measures             |    1837238 |

- Dataset bisa didapatkan melalui [Measures Dataset](https://drive.google.com/open?id=0B2Ksz9hP3LtXRUppZHdhT1pBaWM).

### Import dataset
**Step 1** - Import Measures dataset ke MySQL Database.
```bash
# Create a database for dataset
echo "CREATE DATABASE `database-name`" | mysql -u[username] -p
***insert MySQL password***

# Import the dataset
mysql -u[username] -p < sample_1_8_M_rows_data.sql
***insert MySQL password***
```
> [username] = username MySQL yang akan digunakan.

### Benchmarking
```mysql
SELECT SQL_NO_CACHE
    COUNT(*)
FROM
    vertabelo.measures
WHERE
    measure_timestamp >= '2016-01-01'
        AND DAYOFWEEK(measure_timestamp) = 1;
     
SELECT SQL_NO_CACHE
    COUNT(*)
FROM
    vertabelo.partitioned_measures
WHERE
    measure_timestamp >= '2016-01-01'
        AND DAYOFWEEK(measure_timestamp) = 1;
```