# Fragmentasi pada MySQL Menggunakan Partisi Horizontal
***Oleh Nahda Fauziyah Zahra (05111540000141)***

- [Fragmentasi pada MySQL Menggunakan Partisi Horizontal](#fragmentasi-pada-mysql-menggunakan-partisi-horizontal)
    - [Deskripsi server](#deskripsi-server)
    - [Implementasi Partisi 1: Sakila Dataset](#implementasi-partisi-1-sakila-dataset)
        - [Deskripsi dataset](#deskripsi-dataset)
        - [Proses pembuatan partisi](#proses-pembuatan-partisi)
        - [Implementasi Partisi](#implementasi-partisi)
        - [Benchmarking](#benchmarking)
            - [Table payment](#table-payment)
            - [Tabel rental](#tabel-rental)
    - [Implementasi Partisi 2: Measures Dataset](#implementasi-partisi-2-measures-dataset)
        - [Deskripsi dataset](#deskripsi-dataset)
        - [Import dataset](#import-dataset)
        - [Benchmarking](#benchmarking)
            - [SELECT Query](#select-query)
            - [BIG DELETE Query](#big-delete-query)
    - [Kesimpulan](#kesimpulan)

## Deskripsi server
- Sistem operasi  : Linux Mint 18.3 Cinnamon 64-bit
- Versi MySQL     : 5.7.23
- RAM             : 4 GB
- CPU             : 4 cores

## Implementasi Partisi 1: Sakila Dataset

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
        PARTITION p12 VALUES LESS THAN (13) ENGINE = InnoDB
    );
    ```

**Catatan :**
> Ketika melakukan partisi pada sebuah tabel, tidak dapat menggunakan `FOREIGN KEY`, maka deklarasi `FOREIGN KEY` pada waktu membuat table tidak dieksekusi.

> `PRIMARY KEY` harus tetap tercantum pada setiap tabel partisi. Jika partisi yang dilakukan tidak menggunakan `PRIMARY KEY` tabel tersebut, atribut (kolom) yang dijadikan parameter untuk predikat harus menjadi `PRIMARY KEY` tabel tersebut.

### Benchmarking

#### Table payment

**Step 1** - Periksa tabel yang dipartisi menggunakan query `EXPLAIN`.

```EXPLAIN SELECT COUNT(*) FROM payment\G```

![Explain table payment](/home/zahra/Documents/_TERM-7/BDT/self-bdt-2018/Tugas-2/images/explain1.png)

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

![Benchmarking Table payment](/home/zahra/Documents/_TERM-7/BDT/self-bdt-2018/Tugas-2/images/benchmark_payment.png)

#### Tabel rental
**Step 1** - Periksa tabel yang dipartisi menggunakan query `EXPLAIN`.

```EXPLAIN SELECT COUNT(*) FROM rental\G```

![Explain table rental](/home/zahra/Documents/_TERM-7/BDT/self-bdt-2018/Tugas-2/images/explain2.png)

**Step 2** - Tambahkan `UNNIQUE INDEX` untuk `payment_date` sebagai `PRIMARY KEY` yang digunakan dalam tabel-tabel partisi.

```mysql
ALTER TABLE `sakila`.`rental`
DROP INDEX `rental_date` ,
ADD UNIQUE INDEX `rental_date` (`rental_id` ASC, `rental_date` ASC, `inventory_id` ASC, `customer_id` ASC);
```

**Step 3** - Lakukan verifikasi partisi dengan pengujian menggunakan query `INSERT`.
```mysql
-- insert data to PARTITION p01
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16050, "2018-01-1 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16057, "2018-01-1 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16064, "2018-01-1 15:16:05", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16071, "2018-01-1 15:16:06", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16078, "2018-01-1 15:16:07", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16085, "2018-01-1 15:16:08", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16092, "2018-01-1 15:16:09", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16099, "2018-01-1 15:16:10", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16106, "2018-01-1 15:16:11", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16113, "2018-01-1 15:16:12", "4472", "374", \N, "2", "2018-09-15 21:30:53");

-- insert data to PARTITION p02
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16056, "2018-02-18 15:16:03", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16063, "2018-02-18 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16070, "2018-02-18 15:16:05", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16077, "2018-02-18 15:16:06", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16084, "2018-02-18 15:16:07", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16091, "2018-02-18 15:16:08", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16098, "2018-02-18 15:16:09", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16105, "2018-02-18 15:16:10", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16112, "2018-02-18 15:16:11", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16119, "2018-02-18 15:16:12", "4472", "374", \N, "2", "2018-09-15 21:30:53");

-- insert data to PARTITION p03
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16055, "2018-03-18 15:16:03", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16062, "2018-03-18 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16069, "2018-03-18 15:16:05", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16076, "2018-03-18 15:16:06", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16083, "2018-03-18 15:16:07", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16090, "2018-03-18 15:16:08", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16097, "2018-03-18 15:16:09", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16104, "2018-03-18 15:16:10", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16111, "2018-03-18 15:16:11", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16118, "2018-03-18 15:16:12", "4472", "374", \N, "2", "2018-09-15 21:30:53");

-- insert data to PARTITION p04
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16054, "2018-04-18 15:16:03", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16061, "2018-04-18 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16068, "2018-04-18 15:16:05", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16075, "2018-04-18 15:16:06", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16082, "2018-04-18 15:16:07", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16089, "2018-04-18 15:16:08", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16096, "2018-04-18 15:16:09", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16103, "2018-04-18 15:16:10", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16110, "2018-04-18 15:16:11", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16117, "2018-04-18 15:16:12", "4472", "374", \N, "2", "2018-09-15 21:30:53");

-- insert data to PARTITION p05
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16053, "2018-05-18 15:16:03", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16060, "2018-05-18 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16067, "2018-05-18 15:16:05", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16074, "2018-05-18 15:16:06", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16081, "2018-05-18 15:16:07", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16088, "2018-05-18 15:16:08", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16095, "2018-05-18 15:16:09", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16102, "2018-05-18 15:16:10", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16109, "2018-05-18 15:16:11", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16116, "2018-05-18 15:16:12", "4472", "374", \N, "2", "2018-09-15 21:30:53");

-- insert data to PARTITION p06
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16052, "2018-06-18 15:16:03", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16059, "2018-06-18 15:16:04", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16066, "2018-06-18 15:16:05", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16073, "2018-06-18 15:16:06", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16080, "2018-06-18 15:16:07", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16087, "2018-06-18 15:16:08", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16094, "2018-06-18 15:16:09", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16101, "2018-06-18 15:16:10", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16108, "2018-06-18 15:16:11", "4472", "374", \N, "2", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16115, "2018-06-18 15:16:12", "4472", "374", \N, "2", "2018-09-15 21:30:53");

-- insert data to PARTITION p07
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16051, "2018-07-18 15:16:03", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16058, "2018-07-18 15:16:04", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16065, "2018-07-18 15:16:05", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16072, "2018-07-18 15:16:06", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16079, "2018-07-18 15:16:07", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16086, "2018-07-18 15:16:08", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16093, "2018-07-18 15:16:09", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16100, "2018-07-18 15:16:10", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16107, "2018-07-18 15:16:11", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16114, "2018-07-18 15:16:12", "14599", "374", \N, "1", "2018-09-15 21:30:53");

-- insert data to PARTITION p08
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16120, "2018-08-18 15:16:03", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16121, "2018-08-18 15:16:04", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16122, "2018-08-18 15:16:05", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16123, "2018-08-18 15:16:06", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16124, "2018-08-18 15:16:07", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16125, "2018-08-18 15:16:08", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16126, "2018-08-18 15:16:09", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16127, "2018-08-18 15:16:10", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16128, "2018-08-18 15:16:11", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16129, "2018-08-18 15:16:12", "14599", "374", \N, "1", "2018-09-15 21:30:53");

-- insert data to PARTITION p09
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16130, "2018-09-18 15:16:03", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16131, "2018-09-18 15:16:04", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16132, "2018-09-18 15:16:05", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16133, "2018-09-18 15:16:06", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16134, "2018-09-18 15:16:07", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16135, "2018-09-18 15:16:08", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16136, "2018-09-18 15:16:09", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16137, "2018-09-18 15:16:10", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16138, "2018-09-18 15:16:11", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16139, "2018-09-18 15:16:12", "14599", "374", \N, "1", "2018-09-15 21:30:53");

-- insert data to PARTITION p10
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16140, "2018-10-18 15:16:03", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16141, "2018-10-18 15:16:04", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16142, "2018-10-18 15:16:05", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16143, "2018-10-18 15:16:06", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16144, "2018-10-18 15:16:07", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16145, "2018-10-18 15:16:08", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16146, "2018-10-18 15:16:09", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16147, "2018-10-18 15:16:10", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16148, "2018-10-18 15:16:11", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16149, "2018-10-18 15:16:12", "14599", "374", \N, "1", "2018-09-15 21:30:53");

-- insert data to PARTITION p11
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16150, "2018-11-18 15:16:03", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16151, "2018-11-18 15:16:04", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16152, "2018-11-18 15:16:05", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16153, "2018-11-18 15:16:06", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16154, "2018-11-18 15:16:07", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16155, "2018-11-18 15:16:08", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16156, "2018-11-18 15:16:09", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16157, "2018-11-18 15:16:10", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16158, "2018-11-18 15:16:11", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16159, "2018-11-18 15:16:12", "14599", "374", \N, "1", "2018-09-15 21:30:53");

-- insert data to PARTITION p12
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16160, "2018-12-18 15:16:03", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16161, "2018-12-18 15:16:04", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16162, "2018-12-18 15:16:05", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16163, "2018-12-18 15:16:06", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16164, "2018-12-18 15:16:07", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16165, "2018-12-18 15:16:08", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16166, "2018-12-18 15:16:09", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16167, "2018-12-18 15:16:10", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16168, "2018-12-18 15:16:11", "14599", "374", \N, "1", "2018-09-15 21:30:53");
INSERT INTO `rental` (`rental_id`, `rental_date`, `inventory_id`, `customer_id`, `return_date`, `staff_id`, `last_update`) VALUES (16169, "2018-12-18 15:16:12", "14599", "374", \N, "1", "2018-09-15 21:30:53");
```

**Step 3** - Periksa dengan menggunakan query select 
```mysql
-- menjalankan query ke tabel partisi data yang benar
SELECT * FROM rental PARTITION (p03) WHERE rental_date = '2018-03-18 15:16:05';

-- menjalankan query ke tabel partisi data yang salah
SELECT * FROM rental PARTITION (p07) WHERE rental_date = '2018-03-18 15:16:05';
```

![Benchmarking Table payment](/home/zahra/Documents/_TERM-7/BDT/self-bdt-2018/Tugas-2/images/benchmark_rental.png)

## Implementasi Partisi 2: Measures Dataset

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
> [username], password = username dan password yang digunakan pada MySQL Database.

### Benchmarking

#### SELECT Query

* Hapus index pada tabel untuk melihat performa asli dari query yang dieksekusi.
    ```mysql
    ALTER TABLE `vertabelo`.`measures` 
    DROP INDEX `measure_timestamp` ;
    
    ALTER TABLE `vertabelo`.`partitioned_measures` 
    DROP INDEX `measure_timestamp` ;

    ```

* Query `SELECT` untuk tabel tanpa pertisi.
    ```mysql
    SELECT SQL_NO_CACHE
        COUNT(*)
    FROM
        vertabelo.measures
    WHERE
        measure_timestamp >= '2016-01-01'
            AND DAYOFWEEK(measure_timestamp) = 1;
    ```

* Query `SELECT` untuk tabel dengan partisi.
    ```mysql
    SELECT SQL_NO_CACHE
        COUNT(*)
    FROM
        vertabelo.partitioned_measures
    WHERE
        measure_timestamp >= '2016-01-01'
            AND DAYOFWEEK(measure_timestamp) = 1;
    ```

* Hasil Query 

|No       | Tabel tanpa Partisi (detik) | Tabel dengan Partisi (detik) |
|:-------:|:---------------------------:|:----------------------------:|
|1.       | 2,49                        | 1,01                         |
|2.       | 0,76                        | 0,42                         |
|3.       | 0,76                        | 0,42                         |
|4.       | 0,75                        | 0,41                         |
|5.       | 0,75                        | 0,41                         |
|6.       | 0,76                        | 0,41                         |
|7.       | 0,75                        | 0,42                         |
|8.       | 0,75                        | 0,42                         |
|9.       | 0,76                        | 0,43                         |
|10.      | 0,76                        | 0,41                         |
|Rata-rata| 0,93                        | 0,48                         |

#### BIG DELETE Query

* Tambahkan kembali index yang telah dihapus sebelumnya untuk  mengeksekusi query `BIG DELETE`.
    ```mysql
    ALTER TABLE `vertabelo`.`measures` 
    ADD INDEX `index1` (`measure_timestamp` ASC);
    ALTER TABLE `vertabelo`.`partitioned_measures` 
    ADD INDEX `index1` (`measure_timestamp` ASC);
    ```

* Query `BIG DELETE` untuk tabel tanpa partisi.
    ```mysql
    DELETE
    FROM vertabelo.measures
    WHERE  measure_timestamp < '2015-01-01';
    ```

* Query `BIG DELETE` untuk tabel tanpa partisi.
    ```mysql
    ALTER TABLE vertabelo.partitioned_measures 
    DROP PARTITION to_delete_logs ;
    ```

* Hasil Query

|No       | Tabel tanpa Partisi (detik) | Tabel dengan Partisi (detik) |
|:-------:|:---------------------------:|:----------------------------:|
|1.       | 1,69                        | 0,98                         |
|2.       | 1,74                        | 1,86                         |
|3.       | 2,97                        | 0,43                         |
|4.       | 0,78                        | 0,47                         |
|5.       | 1,51                        | 1,22                         |
|6.       | 0,44                        | 0,39                         |
|7.       | 1,34                        | 0,51                         |
|8.       | 1,26                        | 0,84                         |
|9.       | 0,46                        | 0,41                         |
|10.      | 0,58                        | 0,46                         |
|Rata-rata| 1,24                        | 0,76                         |

## Kesimpulan
Pertimbangan untuk menentukan predikat untuk *Horizontal Partition* pada sebuah tabel salah satunya dapat dilihat dari banyaknya data yang terdapat dalam tabel tersebut. Maksimalkan fungsi dari *Horizantal Partition* untuk meminimalkan waktu eksekusi query yang sesuai dengan kebutuhan. Ketika membuat partisi pada tabel, perlu memperhatikan syarat-syarat fragmentasi diantaranya :
- **Tidak diperbolehkan** penggunaan `FOREIGN KEY`.
- Penggunaan `UNIQUE` dan `PRIMARY KEY` pada tabel.
- Metode pembagian yang digunakan pada masing-masing fungsi `PARTITION` (`KEY`, `HASH`, `RANGE`, dan `LIST`).
- Buktikan proses fragmentasi telah benar dengan pembuktian kondisi ***Completeness***, ***Reconstruction***, dan ***Disjointness***.
- dsb.
