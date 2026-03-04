// File: postcss.config.cjs
//
// Vite secara otomatis mendeteksi dan menjalankan PostCSS saat
// menemukan file ini. Konfigurasi ini dijalankan setiap build/dev,
// mengubah @tailwind directives di src/index.css menjadi CSS nyata.
//
// Ekstensi .cjs dipakai (bukan .js) karena package.json "type": "module".

module.exports = {
  plugins: {
    // Tailwind CSS — harus ada sebelum autoprefixer
    tailwindcss: {},
    // Autoprefixer — menambahkan vendor prefix otomatis untuk browser lama
    autoprefixer: {},
  },
};
