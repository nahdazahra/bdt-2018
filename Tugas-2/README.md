# Fragmentasi pada MySQL Menggunakan Partisi Horizontal

## Deskripsi server
- Sistem operasi  : Linux Mint 18.3 Cinnamon 64-bit
- Versi MySQL     : MySQL Ver 14.14 Distrib 5.7.23
- RAM             : 3.6 GB
- CPU             :  core

## Implementasi Partisi 1: Sakila DB

### Deskripsi dataset
- Dataset ini terdiri dari 16 tabel.
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
> Ketika melakukan partisi pada sebuah tabel, tidak dapat menggunakan `FOREIGN KEY`, maka deklarasi `FOREIGN KEY` pada waktu membuat table dieksekusi.

> `PRIMARY KEY` harus tetap tercantum pada setiap tabel partisi. Jika partisi yang dilakukan tidak menggunakan `PRIMARY KEY` tabel tersebut, atribut (kolom) yang dijadikan parameter untuk predikat harus menjadi `PRIMARY KEY` tabel tersebut.

### Benchmarking
**Step 1** - Periksa menggunakan query `SELECT`.
  ```mysql
  
  ```
**Step 2** - Periksa dengan menggunakan query select 

## Implementasi Partisi 2: measures dataset

### Deskripsi dataset

### Import dataset

### Benchmarking

Checking MySQL
- ```select count(*) from payment;``` jumlahnya sama di setiap db
- ```explain select count(*) from payment;```
