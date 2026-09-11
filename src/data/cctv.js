// CCTV Database - Portal links (iframe tidak bisa karena X-Frame-Options pemerintah)
// Semua kamera bisa diakses via tombol "Buka Portal"
export const CCTV_DATA = [
  // === JAKARTA ===
  {id:1, name:'Bundaran HI',          city:'Jakarta', lat:-6.1944,lon:106.8229, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Portal CCTV resmi DKI Jakarta'},
  {id:2, name:'Semanggi',             city:'Jakarta', lat:-6.2167,lon:106.8089, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Persimpangan Semanggi'},
  {id:3, name:'Sudirman',             city:'Jakarta', lat:-6.2088,lon:106.8217, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Jalan Sudirman'},
  {id:4, name:'Thamrin',              city:'Jakarta', lat:-6.1911,lon:106.8239, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Jalan Thamrin'},
  {id:5, name:'Kuningan',             city:'Jakarta', lat:-6.2297,lon:106.8300, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Kawasan Kuningan'},
  {id:6, name:'Grogol',               city:'Jakarta', lat:-6.1667,lon:106.7933, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Persimpangan Grogol'},
  {id:7, name:'Kampung Melayu',       city:'Jakarta', lat:-6.2247,lon:106.8667, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Terminal Kampung Melayu'},
  {id:8, name:'Tomang',               city:'Jakarta', lat:-6.1789,lon:106.8044, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Simpang Tomang'},
  {id:9, name:'Cempaka Mas',          city:'Jakarta', lat:-6.1742,lon:106.8742, type:'ATCS',    portal:'https://smarttraffic.jakarta.go.id', info:'Pusat Jakarta Utara'},
  // === TOL NASIONAL ===
  {id:10,name:'Tol Cikampek KM47',    city:'Jawa Barat',lat:-6.3411,lon:107.1244,type:'TOL',   portal:'https://cctv.bpjt.pu.go.id',        info:'Tol Jakarta-Cikampek'},
  {id:11,name:'Tol Cipularang KM72',  city:'Jawa Barat',lat:-6.7083,lon:107.4000,type:'TOL',   portal:'https://cctv.bpjt.pu.go.id',        info:'Tol Cipularang'},
  {id:12,name:'Tol Jagorawi KM10',    city:'Bogor',     lat:-6.3500,lon:106.9000,type:'TOL',   portal:'https://cctv.bpjt.pu.go.id',        info:'Tol Jagorawi'},
  {id:13,name:'Tol Dalam Kota',       city:'Jakarta',   lat:-6.2200,lon:106.8100,type:'TOL',   portal:'https://cctv.bpjt.pu.go.id',        info:'Tol Dalam Kota Jakarta'},
  {id:14,name:'Tol Semarang-Solo',    city:'Jawa Tengah',lat:-7.1500,lon:110.5000,type:'TOL',  portal:'https://cctv.bpjt.pu.go.id',        info:'Tol Trans Jawa'},
  // === BANDUNG ===
  {id:15,name:'Simpang Dago',         city:'Bandung', lat:-6.8775,lon:107.6122, type:'ATCS',   portal:'https://atcs.bandung.go.id',         info:'ATCS Kota Bandung'},
  {id:16,name:'Asia Afrika',          city:'Bandung', lat:-6.9175,lon:107.6097, type:'ATCS',   portal:'https://atcs.bandung.go.id',         info:'Jl. Asia Afrika Bandung'},
  {id:17,name:'Pasteur',              city:'Bandung', lat:-6.8942,lon:107.5883, type:'ATCS',   portal:'https://atcs.bandung.go.id',         info:'Pintu Tol Pasteur'},
  {id:18,name:'Soekarno-Hatta Bdg',   city:'Bandung', lat:-6.9000,lon:107.6167, type:'ATCS',   portal:'https://atcs.bandung.go.id',         info:'Jalan utama Bandung'},
  // === YOGYAKARTA ===
  {id:19,name:'Malioboro',            city:'Yogyakarta',lat:-7.7931,lon:110.3661,type:'ATCS',  portal:'https://atcs.jogjakota.go.id',       info:'Jl. Malioboro Yogyakarta'},
  {id:20,name:'Tugu Yogyakarta',      city:'Yogyakarta',lat:-7.7829,lon:110.3672,type:'ATCS',  portal:'https://atcs.jogjakota.go.id',       info:'Tugu Jogja'},
  {id:21,name:'Jl. Solo',             city:'Yogyakarta',lat:-7.7800,lon:110.4000,type:'ATCS',  portal:'https://atcs.jogjakota.go.id',       info:'Ring Road Yogyakarta'},
  // === SURABAYA ===
  {id:22,name:'Tunjungan',            city:'Surabaya', lat:-7.2575,lon:112.7378, type:'ATCS',  portal:'https://dishub.surabaya.go.id',      info:'Pusat Kota Surabaya'},
  {id:23,name:'Darmo',                city:'Surabaya', lat:-7.2811,lon:112.7311, type:'ATCS',  portal:'https://dishub.surabaya.go.id',      info:'Jl. Raya Darmo'},
  {id:24,name:'Wonokromo',            city:'Surabaya', lat:-7.3041,lon:112.7367, type:'ATCS',  portal:'https://dishub.surabaya.go.id',      info:'Simpang Wonokromo'},
  // === BALI ===
  {id:25,name:'Pantai Kuta',          city:'Bali',     lat:-8.7183,lon:115.1686, type:'PUBLIK',portal:'https://www.denpasarkota.go.id',     info:'Pantai Kuta Bali'},
  {id:26,name:'Ngurah Rai Airport',   city:'Bali',     lat:-8.7467,lon:115.1669, type:'BANDARA',portal:'https://bali-airport.com',          info:'Bandara Ngurah Rai'},
  // === SOEKARNO-HATTA ===
  {id:27,name:'Soekarno-Hatta T3',    city:'Tangerang',lat:-6.1256,lon:106.6559, type:'BANDARA',portal:'https://angkasapura2.co.id',        info:'Terminal 3 Soetta'},
  // === SUMATERA ===
  {id:28,name:'Simpang Lima Semarang',city:'Semarang', lat:-6.9932,lon:110.4203, type:'ATCS',  portal:'https://dishub.semarangkota.go.id',  info:'Pusat Kota Semarang'},
  {id:29,name:'Pantai Losari',        city:'Makassar', lat:-5.1467,lon:119.4067, type:'PUBLIK',portal:'https://makassarkota.go.id',         info:'Ikonik Pantai Losari'},
  {id:30,name:'Kota Tua Medan',       city:'Medan',    lat: 3.5875,lon: 98.6744, type:'ATCS',  portal:'https://dishub.pemkomedan.go.id',    info:'Pusat Kota Medan'},
]
