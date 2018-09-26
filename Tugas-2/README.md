# Fragmentasi pada MySQL Menggunakan Partisi Horizontal

## Deskripsi server
- Sistem operasi  : Linux Mint 18.3 Cinnamon 64-bit
- Versi MySQL     : MySQL Ver 14.14 Distrib 5.7.23
- RAM             : 3.6 GB
- CPU             :  core

## Implementasi Partisi 1: Sakila DB

### Deskripsi dataset
- Dataset ini terdiri dari x tabel
- Masing-masing tabel memiliki jumlah baris data sebagai berikut

### Proses pembuatan partisi
- Pemilihan tabel yang akan dipartisi
  1. step-step bagaimana cara pemilihan tabel yang akan dibuat partisi
  2. ...

- Daftar tabel yang akan dipartisi
  * Table 1
    1. Penentuan predikat (p) dalam membuat partisi
    2. Partisi menggunakan metode Hash.
    3. Berdasarkan predikat di atas, maka table tersebut akan terbagi menjadi ... bagian.
    4. Nama dari partisi-partisinya adalah :
      *  

  * Table 2

### Benchmarking

## Implementasi Partisi 2: measures dataset

### Deskripsi dataset

### Import dataset

### Benchmarking

Checking MySQL
- ```select count(*) from payment;``` jumlahnya sama di setiap db
- ```explain select count(*) from payment;```
