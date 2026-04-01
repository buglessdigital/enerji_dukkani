# Enerji Dükkanı E-Ticaret Sitesi İsterleri
Lütfen sitenin ve admin panelinin sahip olması gereken tüm özellikleri, tasarım detaylarını ve gereksinimleri bu dosyanın içine yapıştırın.


1. Üst Menü (Navbar) Yapısı
A. İşlevsel Alanlar (Sağ Üst / Orta)
Logo: Marka kimliğini temsil eden ana odak noktası.
Ürün Arama: Kullanıcının enerji ürünlerine hızlıca ulaşmasını sağlayacak "Search Bar".
Kullanıcı Etkileşim İkonları:
Favoriler: Kullanıcıların beğendiği ürünleri sakladığı alan.
Hesabım: Giriş yapma, kayıt olma ve profil yönetimi.
Sepetim: Satın alma sürecine geçiş noktası.
B. Navigasyon Linkleri (Dinamik & Statik)
Bu kısım iki farklı kaynaktan beslenecek şekilde kurgulanmış:
Kategoriler (Dinamik): Admin panelinden eklenecek olan, ürün gruplarına göre otomatik sıralanan menü öğeleri.
Kurumsal Sayfalar (Statik/Sabit):
Bayilik Başvurusu
Hakkımızda
İletişim
 
2. Hero Bölümü (Slider/Kayan Yapı)
Bu bölüm tamamen Admin Paneli kontrollü olacak ve kullanıcıyı doğrudan aksiyona geçirmeye odaklanacak.
Görsel ve İçerik Bileşenleri
Dinamik Arka Plan: Admin panelinden yüklenebilir, yüksek çözünürlüklü kayan resimler (Slider).
Metin Katmanı (Overlay):
Hero Başlığı: Kampanyayı veya ana kategoriyi vurgulayan dikkat çekici başlık.
Hero Açıklaması: Ürün veya hizmet hakkında kısa, ikna edici alt metin.
Eylem Çağrısı (Call to Action - CTA) Butonları
Kullanıcıyı iki farklı amaca yönlendiren çift buton yapısı:
İncele Butonu: İlgili içeriğe veya ürün grubuna yönlendiren birincil buton.
Bize Ulaşın Butonu: Müşteri desteğine veya iletişim sayfasına hızlı erişim sağlayan ikincil buton.
 
 
3. Öne Çıkan Koleksiyonlar (Koleksiyon Kartları)
Bu bölüm, Admin Paneli üzerinden tam kontrol imkanı sunan, interaktif bir vitrin yapısında olacak.
Koleksiyon Kart Bileşenleri (Admin Tarafı)
Admin panelinden her bir kart için şu dört veri tanımlanabilir olacak:
Koleksiyon Resmi: Kartın arka planını veya ana görselini oluşturan yükleme alanı.
Koleksiyon Başlığı: Kartın üzerinde sürekli görünecek olan ana isim.
Hedef Bağlantı (URL): Karta tıklandığında kullanıcının yönlendirileceği sayfa linki.
Hover Metni: Kullanıcı fareyle kartın üzerine geldiğinde (hover durumunda) belirecek olan özel açıklama metni.
İşlevsel Özellikler
CRUD İşlemleri: Admin panelinden yeni koleksiyon kartları eklenebilir, mevcut olanlar düzenlenebilir veya silinebilir olacak.
Interaktif Deneyim (Frontend): * Normal görünümde başlık ve resim ön planda.
Hover (Üzerine Gelme) Efekti: Fare ile üzerine gelindiğinde, admin panelinde belirlenen özel yazı şık bir animasyonla (örneğin alttan yukarı kayarak veya opaklık değişerek) görünecek.
 
 
4. "Sizin İçin Seçtiklerimiz" (Öne Çıkan Ürünler)
Bu alan, genel ürün havuzundan belirli kriterlere göre filtrelenmiş dinamik bir listeleme bölümüdür.
Yönetim Paneli Mantığı
Seçim Flag'i (İşaretleyici): Admin panelinde ürün ekleme veya düzenleme ekranına bir checkbox (onay kutusu) veya switch eklenecek.
Filtreleme: Eğer ürün kartında "Sizin İçin Seçtiklerimiz" seçeneği aktif (true) ise, ürün otomatik olarak ana sayfadaki bu listede yerini alacak.
Ürün Kartı Bileşenleri (Frontend)
Listelenen her ürün kartı standart olarak şu öğeleri içerecek:
Ürün Görseli: Ürünün ana fotoğrafı.
Ürün Adı: Belirgin ve okunabilir başlık.
Fiyat Bilgisi: Güncel satış fiyatı (varsa indirimli fiyat ile birlikte).
Hızlı İşlem Butonları: Sepete ekle ve favorilere ekle ikonları/butonları.
Yönlendirme: Karta tıklandığında ilgili ürünün detay sayfasına gidiş.
 
 
 
5. Footer (Alt Bilgi) Bölümü
Footer, kullanıcıya sitenin her sayfasında eşlik eden; güven, iletişim ve yasal şeffaflık sunan bölümdür.
Sütun Yapısı (4 Kolon)
Sütun: Marka Kimliği
Firma Logosu: Navbar'daki logonun (varsa beyaz/negatif versiyonu) burada da yer alması.
Kısa Açıklama: Markanın vizyonunu veya uzmanlığını anlatan 1-2 cümlelik "Hakkımızda" özeti.
Sütun: Hızlı Linkler
Ürünler (Kategorilere yönlendiren ana link)
Hakkımızda
İletişim
Bayilik Başvurusu
Sütun: Kurumsal & Yasal
Gizlilik Politikası
Kullanım Koşulları
İptal ve İade Koşulları
Mesafeli Satış Sözleşmesi
KVKK Aydınlatma Metni
Sütun: İletişim Bilgileri
Telefon: Tıklanabilir formatta (tel:...)
E-posta: Tıklanabilir formatta (mailto:...)
Adres: Fiziksel adres ve varsa Google Haritalar linki.
 
En Alt Bant (Bottom Bar)
Ödeme Yöntemleri: PayTR, Visa, Mastercard gibi güven veren logoların yer aldığı yatay şerit.
Telif Hakkı: "© 2026 Enerji Dükkanı - Tüm Hakları Saklıdır." metni.
 
 
 
6. Bayilik Başvurusu Sayfası (Form Yapısı)
Bu bölüm, kullanıcıdan kurumsal bilgileri topladığın ve doğrudan veritabanına veya yönetici e-postasına iletilecek olan kısımdır.
Form Giriş Alanları (Inputlar)
Görseldeki sıralamaya göre form şu alanlardan oluşacak:
Firma Ünvanı: Şirketin tam ve resmi adı.
Yetkili Adı Soyadı: Başvuruyu yapan veya iletişim kurulacak kişinin bilgisi.
Telefon Numarası: 05XX XXX XX XX formatında maskelenmiş giriş alanı.
E-posta Adresi: Kurumsal iletişim için geçerli bir mail adresi.
Faaliyet Alanı: Firmanın uzmanlık alanı (Örn: Elektrik, İnşaat, Mühendislik vb.).
Vergi Dairesi: Şirketin kayıtlı olduğu vergi dairesi.
Vergi No / TC Kimlik No: Şahıs veya limited/anonim şirket ayrımı için gerekli numara.
Açık Adres: Firmanın fiziksel konum bilgilerini içeren geniş metin alanı (Textarea).
 
 
 
7. Hakkımızda Sayfası Yapısı
Bu sayfa, hem sabit bir kurumsal duruş sergileyecek hem de admin panelinden güncellenebilir içeriklere sahip olacak.
A. Sayfa Üstü (Hakkımızda Hero)
Görsel: Ana sayfadaki hero bölümünden daha dar (slim) yapıda, kurumsal bir arka plan resmi.
Başlık: Büyük ve net bir şekilde "Hakkımızda" yazısı.
Breadcrumb (Navigasyon İzi): Kullanıcının nerede olduğunu anlaması için küçük bir Ana Sayfa > Hakkımızda yönlendirmesi.
B. Ana İçerik Alanı (Admin Panelinden Yönetilebilir)
Hakkımızda Metni: Admin panelindeki bir Zengin Metin Editörü (WYSIWYG) aracılığıyla girilen yazı.
Not: Bu editör sayesinde yazıyı kalınlaştırabilir, listeler ekleyebilir veya alt başlıklar oluşturabilirsin.
Kurumsal Görsel: Yazının yanında veya altında yer alacak, firmayı veya ekibi temsil eden bir "Öne Çıkan Görsel" alanı.
C. Ek Gereksinimler (Profesyonel Dokunuşlar)
Sadece bir yazı yığını olmaması için şu bölümleri de admin panelinden yönetilebilir şekilde ekleyebiliriz:
Vizyon & Misyon Kartları: * İki ayrı kutucuk içerisinde firmanın gelecek hedefi (Vizyon) ve varlık sebebi (Misyon).
Değerlerimiz / Neden Biz?
İkonlarla desteklenmiş kısa maddeler (Örn: Güvenilir Enerji, %100 Müşteri Memnuniyeti, Yenilikçi Çözümler).
Sayılarla Biz (Opsiyonel):
"10+ Yıllık Tecrübe", "500+ Tamamlanan Proje", "1000+ Mutlu Müşteri" gibi güven veren sayaçlar.
 
 
 
8. İletişim Sayfası Yapısı
Bu sayfa, statik bilgilerle dinamik harita verisinin birleşiminden oluşacak ve tamamen Admin Paneli üzerinden güncellenebilir bir yapıda kurgulanacak.
A. İletişim Bilgileri Alanı (Kart Yapısı)
Admin panelinden girilecek verilerin kullanıcıya sunulduğu 3 ana blok:
Telefon: Müşterilerin tek tıkla arama yapabilmesi için tıklanabilir (tel:) formatta.
E-posta: Destek ve bilgi talepleri için kurumsal mail adresi (mailto:).
Adres: Firmanın açık adresi.
B. İnteraktif Harita Görünümü (Konum)
Google Haritalar Entegrasyonu: Admin panelinden girilecek olan bir "Iframe Kodu" veya "Koordinat" bilgisiyle sayfanın alt kısmında geniş bir harita alanı.
Yol Tarifi Butonu: Harita üzerinde kullanıcıyı doğrudan Google Haritalar uygulamasına yönlendiren bir bağlantı.
C. Admin Paneli Gereksinimleri (Yönetim Ekranı)
Bu sayfanın dinamik kalması için panelde şu alanlar bulunmalı:
Genel Bilgi Girişi: Telefon 1, Telefon 2 (Opsiyonel), Kurumsal Mail, Teknik Destek Maili.
Adres Editörü: Metin alanı olarak açık adres girişi.
Harita Embed Alanı: Google Haritalar'dan alınan "Yerleştirme Kodu"nun (Iframe) yapıştırılabileceği bir metin kutusu.
Sosyal Medya Linkleri (Bonus): Sayfanın bir köşesinde Instagram, LinkedIn gibi mecraların ikonları ve linkleri.
 
 
 
9. Hesabım Sayfası (Giriş / Üye Paneli)
Bu sayfa, kullanıcının sisteme kayıtlı olup olmamasına göre dinamik olarak değişen bir arayüze sahip olacak.
 
A. Giriş Yapılmamış Durum (Giriş Formu)
Kullanıcı henüz oturum açmamışsa karşılanacağı şık ve güvenli form yapısı:
Giriş Formu Alanları:
E-posta: Geçerli bir mail adresi girişi.
Şifre: Maskelenmiş şifre alanı (Göz ikonuyla göster/gizle özelliği eklenebilir).
Yardımcı Linkler:
Şifremi Unuttum: Şifre sıfırlama e-postası tetikleyen bir buton/bağlantı.
Sosyal Giriş Seçeneği:
Google ile Giriş Yap: Hızlı ve güvenli oturum açma için Google API entegrasyonu.
Kayıt Ol Yönlendirmesi:
Hemen Üye Ol: Henüz hesabı olmayanlar için kayıt sayfasına veya formuna yönlendiren belirgin bir alan.
 
B. Giriş Yapılmış Durum (Kullanıcı Paneli)
Kullanıcı başarıyla giriş yaptıktan sonra göreceği, sol veya üst menü şeklinde kurgulanmış yönetim alanı:
Profil Bilgileri:
Ad, Soyad, E-posta ve Telefon numarası güncelleme alanı.
Şifre değiştirme seçeneği.
Adreslerim:
Kayıtlı fatura ve teslimat adreslerinin listelenmesi.
Yeni adres ekleme, mevcut adresi düzenleme veya silme (CRUD) imkanı.
Siparişlerim:
Geçmiş ve mevcut siparişlerin listesi.
Sipariş durumu (Hazırlanıyor, Kargoda, Tamamlandı vb.) ve fatura görüntüleme.
Çıkış Yap:
Mevcut oturumu güvenli bir şekilde sonlandıran buton.
 
 
 
10. Ürün Detay Sayfası Yapısı
Bu sayfa, admin panelinden girilen ürün verilerini (başlık, fiyat, stok, teknik özellikler) görsel bir hiyerarşiyle sunar.
A. Üst Kısım: Görsel ve Hızlı Satın Alma (Above the Fold)
Ürün Galeri Alanı (Sol): * Ürünün ana görseli ve altında küçük resimlerden (thumbnail) oluşan kaydırmalı galeri.
Üzerine gelince büyüteç (zoom) özelliği.
Ürün Özet Bilgileri (Sağ):
Ürün Başlığı: Net ve büyük fontla yazılmış ürün adı.
Stok Durumu: "Stokta Var" veya "Tükendi" ibaresi (Admin panelindeki stok sayısına göre dinamik).
Fiyat Alanı: Güncel fiyat ve varsa üzeri çizili eski fiyat (İndirim oranıyla birlikte).
Kısa Açıklama: Ürünün en can alıcı 2-3 özelliğini belirten spot metin.
Varyasyon Seçimi: (Varsa) Güç değeri (Watt), renk veya boyut seçenekleri.
Miktar ve Sepet: Adet seçici, "Sepete Ekle" butonu ve "Hemen Al" seçeneği.
Favorilere Ekle: Kalp ikonu ile hızlı liste oluşturma.
 
B. Orta Kısım: Detaylı Bilgilendirme (Tab Menü Yapısı)
Kullanıcının sayfayı aşağı kaydırdığında karşılaşacağı, sekmeli (tab) bilgi alanı:
Ürün Açıklaması: Admin panelindeki zengin metin editöründen gelen, ürünün kullanım alanlarını ve avantajlarını anlatan uzun metin.
Teknik Özellikler: Ürünün teknik verilerinin (Voltaj, Amper, Verimlilik vb.) bir tablo halinde sunulduğu alan.
Teslimat ve İade: Kargo süresi ve iade koşulları hakkında standart bilgilendirme metni.
 
C. Alt Kısım: Sosyal Kanıt ve Çapraz Satış
Benzer Ürünler / Tamamlayıcı Ürünler: * "Bu ürünü alanlar bunları da inceledi" başlığı altında aynı kategorideki diğer ürünlerin kayan (slider) listesi.
Müşteri Yorumları (Opsiyonel): * Ürünü satın alanların bıraktığı yıldızlı puanlar ve yorumlar.
 
 
 
 
11. Tasarım Dili ve Görsel Kimlik
A. Renk Paleti (Color Palette)
Sitede renklerin kullanım oranlarını şu şekilde dengeleyebiliriz:
Ana Renk (Güven): Mavi (Kurumsal güveni temsil eder. Navbar, butonlar, başlıklar ve ikonlarda ana odak rengi).
Vurgu Rengi (Enerji): Turuncu (Harekete geçirici renk. "Sepete Ekle", "İncele", "Hemen Üye Ol" gibi kritik butonlarda ve indirim oranlarında kullanılır).
Zemin Rengi (Temizlik): Beyaz/Açık Gri (Sitenin arka planı. Ürün görsellerinin ön plana çıkmasını ve modern, ferah bir görünüm sağlar).
B. Tipografi (Modern Yazı Tipleri)
Websitesinin modern ve okunabilir olması için Sans-Serif font ailesinden seçim yapılmalı:
Başlıklar (Headings): Montserrat veya Poppins (Güçlü, geometrik ve profesyonel durur).
Gövde Metinleri (Body): Inter veya Roboto (Uzun okumalarda gözü yormayan, temiz ve modern karakterler).
C. Güven Uyandıran Tasarım Öğeleri
Kullanıcının "Buradan alışveriş yapabilirim" demesini sağlayacak görsel dokunuşlar:
Yumuşatılmış Köşeler (Border Radius): Kart yapılarında ve butonlarda aşırı keskin köşeler yerine hafif yuvarlatılmış (örneğin 8px - 12px) köşeler kullanarak daha modern ve kullanıcı dostu bir his yaratacağız.
Gölge Kullanımı (Soft Shadows): Elemanların sayfadan hafifçe yükselmiş gibi durmasını sağlayan derinlik efektleri (Card shadows).
İkon Seti: Lineer (çizgisel) ve minimalist ikon setleri (Lucide Icons veya FontAwesome gibi).
Beyaz Alan (White Space): İçeriklerin birbirine yapışık olmaması, nefes alan bir düzen ile profesyonel bir katalog hissi verilmesi.
 
D. Bölümlere Göre Uygulama Örneği

 
 
 
 
12. Performans ve Teknik Standartlar
Web sitesinin uçtan uca hızlı çalışması ve modern web standartlarına (Core Web Vitals) uyum sağlaması için uygulanacak kurallar:
 
A. Görsel Optimizasyonu (En Kritik Madde)
Sitenin yüklenme hızını %70'e kadar artıracak görsel kuralları:
WebP Formatı: Sitedeki tüm görseller (Ürünler, Hero, Koleksiyonlar) WebP formatında servis edilmelidir.
Responsive Images: Kullanıcın cihazına göre (Mobil/Masaüstü) farklı boyutlarda resim gönderen srcset yapısı kullanılmalı.
Lazy Loading: Sayfa açıldığında sadece ekranda görünen resimler yüklenmeli; kullanıcı aşağı kaydırdıkça diğer resimler (Ürün listeleri, Footer logoları) yüklenmeye başlamalıdır.
Admin Paneli Otomasyonu: Admin panelinden .jpg veya .png yüklense bile, arka planda bir kütüphane (Sharp veya Canvas gibi) ile otomatik olarak WebP'ye dönüştürülüp sıkıştırılmalıdır.
B. Kod ve Dosya Yapısı
Minification: Tüm CSS, JavaScript ve HTML dosyaları yayına alınırken (Build aşamasında) küçültülmeli (minify).
Font Optimizasyonu: Modern yazı tipleri (Montserrat, Inter vb.) yüklenirken font-display: swap; özelliği kullanılarak, font yüklenene kadar sistem fontuyla metnin hemen görünmesi sağlanmalı.
Code Splitting: Kullanıcı "Anasayfa"dayken "Hesabım" sayfasının kodlarını yüklememeli; sadece o an ihtiyaç duyulan kod parçaları yüklenmelidir.
C. Sunucu ve Önbellekleme (Caching)
CDN Kullanımı: Görsellerin ve statik dosyaların kullanıcıya en yakın sunucudan gelmesi için bir CDN (Cloudflare vb.) yapısı kurulmalı.
Browser Caching: Logo, ikonlar ve CSS dosyaları gibi değişmeyen öğeler kullanıcının tarayıcısına kaydedilmeli (Cache-Control), böylece siteye ikinci girişinde anlık açılmalı.
SSR/SSG Avantajı: Eğer mümkünse (Next.js gibi teknolojilerle), sayfaların sunucu tarafında önceden oluşturulması (Pre-rendering) sağlanarak ilk açılış hızı (LCP) maksimize edilmelidir.
D. Veritabanı ve API Verimliliği
Pagination (Sayfalama): Ürün listeleme sayfalarında tüm ürünleri tek seferde çekmek yerine, 12'li veya 24'lü gruplar halinde yükleme yapılmalı.
Indexleme: Veritabanında ürün aramalarının hızlı sonuçlanması için kategori ve ürün adı gibi alanlar "Index"lenmelidir.
 



1. Dashboard (Genel Bakış)
Bu sayfa, admin giriş yaptığında karşılaştığı ilk ekran olup, sitenin anlık nabzını tutar.
A. Üst Bilgi Kartları (Widgetlar)
Verileri sadece rakam olarak değil, (isteğe bağlı olarak) bir önceki döneme göre artış/azalış yüzdeleriyle göstermek faydalı olur.
Toplam Ciro: Günlük, haftalık veya aylık seçenekli (Filtrelenebilir).
Bekleyen Siparişler: Acil aksiyon bekleyen paket sayısı.
Toplam Müşteri Sayısı: Sitedeki kayıtlı kullanıcı havuzu.
Kritik Stok Uyarıları: Stok adedi belirlenen limitin (örn: 5 adet) altına düşen ürün sayısı.
Bugünkü Ziyaretçi: Sitenin o günkü trafik yoğunluğu (Ekstra Tavsiye).
B. Orta Bölüm: Grafikler ve Analizler (Ekstra Tavsiye)
Sadece rakam görmek bazen yetmez, trendi görmek gerekir:
Satış Grafiği: Son 7 günün satış trendini gösteren basit bir çizgi grafik.
En Çok Satan Kategoriler: Hangi "Enerji" grubunun daha popüler olduğunu gösteren bir pasta dilimi.
C. Alt Bölüm: Son 10 Sipariş (Tablo)
Bu tablo "güncel ve canlı" bir şekilde listelenmelidir. Tablo sütunları şu şekilde olmalı:
Sipariş ID: (#10254 gibi)
Müşteri Adı:
Tutar:
Ödeme Yöntemi: (Kredi Kartı / Havale vb.)
Durum: (Hazırlanıyor, Onay Bekliyor, Kargoya Verildi - Renkli badge'ler ile)
Tarih:
İşlem: (Hızlı Görüntüle butonu)
 
 
2. Ürün Yönetimi
Bu sayfa, ürünlerin sergilendiği, filtrelendiği ve yeni girişlerin yapıldığı ana merkezdir.
A. Üst Aksiyon Çubuğu
Ürün Arama Barı: Ürün adı, SKU (Stok Kodu) veya Barkod ile hızlı arama.
Gelişmiş Filtreleme (Ekstra): Kategoriye, markaya veya "Aktif/Pasif" durumuna göre listeyi daraltma.
"Yeni Ürün Ekle" Butonu: Belirttiğin tüm alanları içeren bir modal veya yeni sayfa açar.
B. Ürün Ekleme / Düzenleme Formu İçeriği
Senin listene, profesyonel bir e-ticaret altyapısında olması gereken kritik teknik detayları da ekledim:
Temel Bilgiler:
Ürün Adı: (Örn: Solar Panel 400W)
Slug: (URL yapısı için otomatik oluşturulabilir veya manuel düzenlenebilir).
Marka Seçimi: (Açılır liste).
Kategori & Alt Kategori: Dinamik seçim yapısı (Kategori seçilince ona bağlı alt kategorilerin gelmesi).
İçerik ve Görsel:
Açıklama: Zengin metin editörü (WYSIWYG - Kalın, eğik yazım, link ekleme vb.).
Ürün Görselleri: Sürükle-bırak destekli, birden fazla görsel yüklenebilir alan. (İlk seçilen görsel "Kapak Fotoğrafı" olur).
Öne Çıkarma ve Durum:
Ürün Aktif mi? (Toggle/Switch): Sitede yayında olup olmama durumu.
Sizin İçin Seçtiklerimiz: Ana sayfadaki özel vitrine gönderip göndermeme seçeneği.
Ekstra Teknik Detaylar (Olmazsa Olmazlar):
Fiyat Bilgisi: Alış fiyatı, satış fiyatı ve indirimli fiyat , bayiye indirimli fiyat.(isteğe bağlı olarak alış fiyatının üstüne fiyat eklenebilmesi için yüzdelik girilebilsin aynı şey indirim ve bayi indirimi içinde geçerli
Stok Adedi: Üründen kaç adet var?
SKU (Stok Kodu): Depo takibi için benzersiz kod.
SEO Bilgileri: Meta Başlık ve Meta Açıklama (Google aramaları için).
C. Ürün Listeleme Tablosu
Burada ürünler bir liste halinde sunulur. Her satırda şu bilgiler ve aksiyonlar bulunur:
Küçük Resim (Thumbnail): Ürünün ne olduğunu hemen anlamak için.
Ürün Adı & Marka:
Kategori:
Fiyat & Stok: (Hızlıca göz atmak için).
Durum: Aktif/Pasif ikonu.
İşlemler (Actions):
Düzenle (Kalem İkonu): Formu tekrar açar.
Sil (Çöp Kutusu İkonu): Ürünü sistemden kaldırır (Silmeden önce mutlaka "Emin misiniz?" uyarısı ile).
Kopyala (Ekstra): Benzer bir ürünü hızlıca oluşturmak için verileri klonlar.
 
 
3. Sipariş Yönetimi
Bu sayfa, müşterilerin verdiği tüm siparişlerin durumunun izlendiği ve yönetildiği merkezdir.
A. Sipariş Listeleme Tablosu
Tablo yapısı, bir bakışta en önemli verileri sunacak şekilde şu sütunlardan oluşmalı:
Sipariş No: (Örn: #ENR-2024-001) – Benzersiz takip numarası.
Müşteri: Ad Soyad (Tıklandığında müşteri profiline gidebilir).
Rol: (Müşteri / Kurumsal / Bayi vb.) – Kullanıcının yetki grubunu görmek için.
Ödeme Yöntemi: (Kredi Kartı / Havale / Kapıda Ödeme).
Durum: (Renkli badge'ler ile: Hazırlanıyor, Onay Bekliyor, Kargolandı, Tamamlandı, İptal Edildi).
Tutar: Toplam ödenen miktar.
Tarih (Ekstra): Siparişin ne zaman verildiği (Saat bilgisiyle birlikte).
İşlem: "Görüntüle" butonu (Büyüteç veya göz ikonu).
 
B. Sipariş Detay Sayfası (Pop-up veya Yeni Sayfa)
"Görüntüle" butonuna tıklandığında açılacak olan bu kısım, siparişe dair her şeyi içermelidir:
Müşteri Bilgileri: Ad, Soyad, Telefon, E-posta.
Adres Bilgileri: Teslimat ve Fatura adresleri (Farklı olabilirler).
Ürün Listesi: Sipariş edilen ürünlerin isimleri, adetleri, birim fiyatları ve ara toplam.
Ödeme Özeti: Ara toplam, KDV, Kargo Ücreti ve Genel Toplam.
Durum Güncelleme: Siparişin durumunu değiştirebileceğin (Örn: Hazırlanıyor'dan Kargolandı'ya çekme) bir dropdown menü.
Kargo Bilgisi (Ekstra): Kargo firması seçimi ve Takip No girişi için bir alan.
 
💡 Bu Sayfaya Eklenmesi Gereken Ekstra Özellikler (Tavsiyeler):
Hızlı Durum Filtreleri: Sayfanın üst kısmına "Sadece Bekleyenler", "Sadece İptaller" gibi hızlı sekmeler koyarsan yönetici işlerini çok daha hızlı bitirir.
PDF Fatura Oluştur: Sipariş detayı içinde "Fatura Yazdır" butonu, operasyonu hızlandırır.
Sipariş Notu: Müşterinin sipariş verirken düştüğü özel notlar (Örn: "Zil çalmasın, bebek uyuyor") mutlaka detay sayfasında görünmeli.
 
 
 
4. Kategori Yönetimi
Bu sayfa, mağazadaki ürün gruplandırmasını (Örn: Güneş Panelleri > Monokristal Paneller) yönettiğin alandır.
A. Üst Aksiyon Alanı
Yeni Kategori Ekle Butonu: Tıklandığında bir form açar.
Arama Çubuğu: Kategori adına göre hızlı bulma.
Hepsini Genişlet / Daralt (Ekstra): Alt kategorileri toplu halde görüp gizlemek için.
B. Kategori Ekleme / Düzenleme Formu
Bir kategori eklerken veya düzenlerken şu alanlar olmalıdır:
Kategori Adı: (Örn: İnverterler)
Üst Kategori Seçimi: Eğer bu bir alt kategoriyse, bağlı olduğu ana kategori buradan seçilir. (Boş bırakılırsa "Ana Kategori" olur).
Slug: URL dostu isim (otomatik oluşur).
Kategori Görseli/İkonu: Menüde veya kategori sayfalarında görünecek küçük bir resim.
Açıklama: SEO ve kategori sayfası için kısa metin.
Sıralama (Nümerik): Kategorinin menüde kaçıncı sırada görüneceğini belirlemek için (Örn: 1, 2, 3...).
Durum (Aktif/Pasif): Kategoriyi komple gizlemek için.
 
C. Kategori Listeleme Yapısı (Hiyerarşik Liste)
Düz bir tablo yerine, iç içe geçebilen bir liste yapısı kullanıcı deneyimini artırır:
Ana Kategori 1 (İşlemler: Düzenle | Sil | Alt Kategori Ekle)
Alt Kategori 1.1 (İşlemler: Düzenle | Sil)
Alt Kategori 1.2 (İşlemler: Düzenle | Sil)
Ana Kategori 2
Alt Kategori 2.1
 
💡 Bu Sayfa İçin Ekstra Öneriler (Tavsiyeler):
Sürükle-Bırak (Drag & Drop) Sıralama: Kategorilerin sırasını rakam yazarak değil, listede aşağı yukarı sürükleyerek değiştirebilmek admin için büyük kolaylıktır.
Ürün Sayısı Göstergesi: Her kategorinin yanında o kategoriye bağlı kaç adet "Aktif Ürün" olduğunu göstermek, boş kategorileri tespit etmeni sağlar.
Toplu Silme Koruması: Eğer bir ana kategoriyi siliyorsan, sistem sana şunu sormalı: "Bu kategoriye bağlı alt kategoriler ve ürünler ne olsun? (Onları da sil / Üst kategoriye taşı)". Bu, veri kaybını önler.
 
 
 
 
5. Bayi Yönetimi
Bu sayfa iki ana sekmeden oluşmalıdır: Bayi Başvuruları (Onay bekleyenler) ve Aktif Bayiler (Sisteme kayıtlı olanlar).
A. Bayi Başvuruları Sekmesi (Onay Bekleyenler)
Firmaların gönderdiği formların incelendiği ilk duraktır.
Tablo Sütunları:
Firma Adı:
Yetkili Ad Soyad:
Başvuru Tarihi:
Şehir/Bölge: (Lojistik planlama için önemli).
İşlem: "Başvuru Detayını Görüntüle".
Başvuru Detay Sayfası (İçerik):
Resmi Bilgiler: Vergi No, Vergi Dairesi, Firma Unvanı.
İletişim Bilgileri: Telefon, E-posta, Adres.
Ek Dosyalar: Vergi Levhası, İmza Sirküleri, Ticaret Sicil Gazetesi gibi yüklenen PDF/Görsel dosyaları (Görüntülenebilir/İndirilebilir).
Aksiyon Butonları: "Onayla" (Bayiyi aktif eder ve şifre gönderir) veya "Reddet" (Nedenini açıklayan bir mail ile başvuruyu siler).
 
B. Aktif Bayiler Sekmesi (Mevcut Liste)
Sistemde aktif olarak alışveriş yapan bayilerin listesi.
Tablo Sütunları:
Firma Kodu/ID:
Firma Adı:
Bayi Grubu: (Örn: Altın Bayi, Gümüş Bayi - Farklı indirim oranları için).
Toplam Sipariş Sayısı: (Bayinin performansını görmek için).
Durum: (Aktif / Pasif).
İşlemler: Düzenle (Bilgileri güncelle), Sil (Bayiliği sonlandır).
 
💡 Bu Sayfa İçin Ekstra Öneriler (Tavsiyeler):
Özel İskonto (İndirim) Tanımlama: Bayi düzenleme sayfasında, o bayiye veya bayi grubuna özel bir indirim oranı tanımlayabilirsin. (Örn: "Bu bayi tüm ürünleri %10 indirimli görsün").
Cari Takip (Ekstra): Bayilerin geçmiş ödemelerini ve borç/alacak durumunu görebileceğin küçük bir özet tablo.
Bayi Notları: Adminin bayi hakkında tuttuğu gizli notlar (Örn: "Ödemelerini düzenli yapıyor, güvenilir").
 
 
 
6. Hero Slider Yönetimi
Bu sayfa, ana sayfanın en üstünde yer alan büyük görsel alanın (Slider) içeriğini, sıralamasını ve linklerini yönettiğin kısımdır.
A. Üst Aksiyon Alanı
Yeni Slayt Ekle Butonu: Tıklandığında boş bir form (modal veya yeni sayfa) açar.
B. Slayt Listeleme (Kart Yapısı)
Slaytlar alt alta veya yan yana kartlar (cards) şeklinde listelenir. Her kartın üzerinde şunlar bulunur:
Önizleme Görseli: Slaytın küçük bir kopyası.
Slayt Başlığı: (Örn: "Büyük Yaz İndirimi Başladı!")
Durum Badge'i: (Yayında / Yayında Değil - Renkli gösterge).
Sıra Numarası: (Örn: 1. Slayt).
Alt Butonlar: "Düzenle" (Mavi kalem ikonu) ve "Sil" (Kırmızı çöp kutusu ikonu).
 
C. Slayt Ekleme & Düzenleme Formu İçeriği
Her iki işlemde de (Yeni ekleme veya Mevcut olanı düzenleme) şu alanlar doldurulur:
Görsel Yükleme: Slaytın ana resmi (Masaüstü ve isteğe bağlı olarak mobil için ayrı görsel yükleme alanı eklemek UX'i uçurur).
Slayt Başlığı (H1): Görselin üzerinde büyük puntolu yazı.
Alt Başlık (H2): Başlığın hemen altındaki tamamlayıcı kısa yazı.
Açıklama Metni: Ürün veya kampanya hakkında 1-2 cümlelik detay.
Buton Metni: (Örn: "Hemen İncele", "Alışverişe Başla").
Yönlendirilecek Kategori / Link: Butona tıklandığında hangi kategoriye veya özel URL'ye gideceği (Dropdown/Seçim listesi).
Sıralama (Order): Slaytın kaçıncı sırada görüneceği (Nümerik).
Yayın Durumu (Checkbox/Toggle): "Bu slaytı sitede göster/gizle" kontrolü.
 
 
 
7. Öne Çıkan Koleksiyonlar (Koleksiyon Yönetimi)
Bu bölüm, ana sayfadaki statik ama dikkat çekici "koleksiyon kartlarını" yönetmek için kullanılır.
A. Koleksiyon Listeleme (Grid/Kart Yapısı)
Koleksiyonlar, admin panelinde tıpkı sitedeki görünümlerine benzer küçük kartlar halinde listelenir.
Önizleme: Koleksiyon görseli ve üzerine binen başlık.
Hedef: Hangi kategoriye yönlendirdiği bilgisi.
Durum: "Aktif" veya "Taslak" (Yayında olup olmadığı).
Alt İşlem Butonları:
Düzenle (Mavi): İçerik değiştirme formunu açar.
Sil (Kırmızı): Koleksiyonu sistemden kaldırır.
B. Koleksiyon Ekleme / Düzenleme Formu
Senin belirttiğin alanları daha fonksiyonel hale getirecek detaylarla yapılandırdım:
Görsel Yükleme: Koleksiyonun arka plan resmi. (Buraya bir "Görsel Boyut Önerisi" notu eklemek tasarımı korur, örn: 600x400px).
Koleksiyon Başlığı: Kartın üzerinde görünen ana yazı.
Alt Başlık: Başlığı destekleyen kısa spot cümle (Örn: "Verimliliği %20 Artıran Modeller").
Hedef Kategori (Dropdown): Sitedeki mevcut kategorilerden birini seçme alanı. (Seçilen kategorinin linki otomatik atanır).
Sıralama (Order): Kartların ana sayfada soldan sağa veya yukarıdan aşağıya hangi sırayla dizileceği.
Aktif mi? (Switch/Toggle): Koleksiyonu geçici olarak gizlemek veya mevsimsel olarak yayına almak için.
 
 
 
 
8. Yorum Yönetimi
Bu sayfa, müşterilerin ürünlere veya hizmete dair bıraktığı geri bildirimlerin denetlendiği merkezdir.
A. Üst Sekmeler (Hızlı Filtreleme)
Yorumları durumuna göre ayırmak işini çok hızlandırır:
Onay Bekleyenler: İlk bakman gereken, yeni gelen yorumlar.
Onaylanmışlar: Sitede yayında olan yorumlar.
Reddedilenler/Spam: Sildiğin veya yayına almadığın yorumlar.
B. Yorum Listeleme Tablosu
Tablo şu sütunlardan oluşmalı:
Müşteri: Yorumu yapan kişinin adı (ve varsa profil linki).
İlgili Ürün: Yorumun hangi ürünün altına yapıldığı.
Puan (Rating): (1-5 arası yıldız simgesiyle gösterim).
Yorum İçeriği: Metnin kısa bir özeti (Üzerine gelince veya detayda tamamı görünür).
Tarih: Yorumun yapıldığı zaman.
Durum: (Onay bekliyor / Yayında).
İşlemler:
Onayla (Yeşil Buton): Yorumu anında ürün sayfasında görünür kılar.
Sil / Reddet (Kırmızı Buton): Yorumu sistemden kaldırır.
 
💡 Bu Sayfa İçin Ekstra Öneriler (Tavsiyeler):
Yorum Cevaplama (Ekstra): Admin panelinden yoruma "Mağaza Yanıtı" yazabilme özelliği. (Örn: "Değerli müşterimiz, bizi tercih ettiğiniz için teşekkür ederiz"). Bu, müşteri bağlılığını %40 artırır.
Toplu İşlemler: Sayfadaki tüm yorumları seçip tek tıkla "Hepsini Onayla" veya "Hepsini Sil" diyebilmek büyük kolaylık sağlar.
 
 
 
 
9. Sistem Ayarları (Genel Yapılandırma)
Bu sayfa, sitenin temel çalışma parametrelerini ve kurumsal bilgilerini içerir. Kullanım kolaylığı için bölümlere ayırmak en doğrusudur.
A. Kurumsal Bilgiler (İletişim & Lokasyon)
Sitenin alt kısmında (footer) ve iletişim sayfasında görünecek bilgilerdir:
Site Adı: (Örn: Enerji Dükkanı - Güneş Paneli ve Enerji Sistemleri)
Firma Ünvanı: Resmi fatura ve sözleşme ismi.
E-posta Adresi: (Müşteri destek hattı: info@enerjidukkani.com)
Telefon Numaraları: Sabit hat ve WhatsApp destek hattı.
Adres Bilgisi: (İzmir merkezli operasyonun açık adresi).
B. Görsel ve Tasarım Ayarları
Logo Yükle: Sitenin sol üstündeki ana logo (Aydınlık ve Karanlık mod için iki seçenek eklenebilir).
Favicon Yükle: Tarayıcı sekmesinde görünen küçük ikon.
Footer Logo: Alt kısımda görünecek farklı bir varyasyon.
C. Sosyal Medya Linkleri
Müşterilerin sana ulaşabileceği sosyal ağların URL adresleri:
Instagram, LinkedIn, Facebook, YouTube, X (Twitter).
(Ekstra) WhatsApp Hızlı Buton Ayarı: Sitede sağ altta yüzen WhatsApp butonu aktif mi? Hangi numaraya gitsin?
D. SEO ve Analitik (Teknik Ayarlar)
Google aramalarında üst sıralara çıkmak ve trafiği izlemek için:
Meta Başlık (Title): Sitenin ana sayfa başlığı.
Meta Açıklama (Description): Google sonuçlarında görünen 160 karakterlik özet.
Google Analytics / Tag Manager Kodu: İzleme kodlarını yapıştırabileceğin bir metin alanı.
Arama Motoru İndeksleme (Toggle): Site yapım aşamasındaysa "Google'a kapat" seçeneği.
E. Operasyonel Ayarlar (E-ticaret Özel)
Kargo Ücreti: (Örn: 500 TL ve üzeri ücretsiz kargo veya sabit fiyat).
Para Birimi: (Varsayılan TRY, isteğe bağlı USD/EUR).
Vergi Oranı (KDV): Ürünlere uygulanacak standart KDV oranı.
Site Bakım Modu (Checkbox): Aktif edildiğinde ziyaretçilere "Hizmetinizdeyiz, yakında dönüyoruz" mesajı gösterir.




