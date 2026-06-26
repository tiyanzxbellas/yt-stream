let allVideos = [];
let currentFeatured = null;

const loader = document.getElementById('loader');
const errorMsg = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const homeView = document.getElementById('home-view');
const watchView = document.getElementById('watch-view');
const navbar = document.getElementById('navbar');
const btnBack = document.getElementById('btn-back');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

const extractVideoID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const generateFakeRating = (id) => {
  if(!id) return '8.5';
  const num = (id.charCodeAt(0) % 5) + 5; 
  return (num + (id.charCodeAt(1) % 10) / 10).toFixed(1);
};

const normalizeData = (data) => {
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (data?.result && Array.isArray(data.result)) list = data.result;
  else if (data?.data && Array.isArray(data.data)) list = data.data;
  else if (data?.items && Array.isArray(data.items)) list = data.items;

  return list.map(item => {
    const rawUrl = item.url || item.link || '';
    const vidId = item.videoId || item.id || extractVideoID(rawUrl);
    const hqThumbnail = vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : (item.thumbnail || item.image);

    return {
      id: vidId,
      title: item.title || 'Tanpa Judul',
      shortTitle: (item.title || 'Tanpa Judul').split('|')[0].trim(),
      thumbnail: hqThumbnail,
      fallbackThumb: item.thumbnail || `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
      channel: item.channel || item.author || item.channelTitle || 'YouTube',
      views: item.views || item.viewCount || '',
      duration: item.duration || item.time || '',
    };
  }).filter(item => item.id);
};

const fetchVideos = async (query) => {
  loader.classList.remove('hidden');
  homeView.classList.add('hidden');
  homeView.classList.remove('fade-in'); 
  watchView.classList.add('hidden');
  watchView.classList.remove('fade-in');
  errorMsg.classList.add('hidden');
  
  try {
    const response = await fetch(`https://api-faa.my.id/faa/youtube?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    const normalizedVideos = normalizeData(data);
    
    if (normalizedVideos.length === 0) {
      throw new Error("Pencarian tidak menemukan hasil.");
    }
    
    allVideos = normalizedVideos;
    currentFeatured = allVideos[0];
    
    setTimeout(() => {
      renderHome();
    }, 300);
    
  } catch (err) {
    console.error("Error:", err);
    errorText.innerText = err.message || "Gagal memuat data. Periksa sinyal internet.";
    loader.classList.add('hidden');
    errorMsg.classList.remove('hidden');
  }
};

const renderHome = () => {
  loader.classList.add('hidden');
  homeView.classList.remove('hidden');
  homeView.classList.add('fade-in');
  watchView.classList.add('hidden');
  
  navbar.classList.add('bg-gradient-to-b');
  navbar.classList.remove('bg-[#05070a]');
  navbar.style.boxShadow = 'none';
  btnBack.classList.add('hidden');

  const heroImg = document.getElementById('hero-img');
  heroImg.classList.add('opacity-0', 'scale-105'); 
  
  setTimeout(() => {
    heroImg.src = currentFeatured.thumbnail;
    heroImg.onerror = function() { this.src = currentFeatured.fallbackThumb; };
  }, 50); 
  
  document.getElementById('hero-title').innerText = currentFeatured.shortTitle;
  document.getElementById('hero-channel').innerText = currentFeatured.channel;
  document.getElementById('hero-duration').innerText = currentFeatured.duration || 'HD';
  document.getElementById('hero-desc').innerText = `${currentFeatured.title} - Video unggulan dari channel ${currentFeatured.channel}. ${currentFeatured.views ? 'Total tayang: '+currentFeatured.views : ''}`;
  
  const playBtn = document.getElementById('hero-play-btn');
  playBtn.onclick = () => openWatchPage(currentFeatured);

  const homeGrid = document.getElementById('home-grid');
  homeGrid.innerHTML = '';
  
  const gridVideos = allVideos.filter(v => v.id !== currentFeatured.id);
  
  gridVideos.forEach((video, index) => {
    const card = document.createElement('div');
    card.className = "bg-[#0f172a] rounded-lg overflow-hidden cursor-pointer group card-hover relative fade-in border border-slate-800 hover:border-sky-500/50";
    card.style.animationDelay = `${0.3 + (index * 0.05)}s`;
    card.onclick = () => openWatchPage(video);
    
    card.innerHTML = `
      <div class="relative aspect-video sm:aspect-[4/3] lg:aspect-video overflow-hidden bg-slate-900">
        <img 
          src="${video.fallbackThumb}" 
          alt="${video.shortTitle}" 
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        >
        ${video.duration ? `<div class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">${video.duration}</div>` : ''}
        
        <div class="absolute inset-0 bg-[#0ea5e9]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-[#0ea5e9]/80 backdrop-blur-md rounded-full flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(14,165,233,0.5)]">
            <i class="fas fa-play text-white text-sm sm:text-base ml-1"></i>
          </div>
        </div>
      </div>
      <div class="p-3 bg-gradient-to-t from-[#0f172a] to-[#1e293b]">
         <h4 class="text-white text-xs sm:text-sm font-bold uppercase line-clamp-1 group-hover:text-sky-300 transition-colors">
           ${video.shortTitle}
         </h4>
         <p class="text-slate-400 text-[10px] sm:text-xs mt-1 line-clamp-1 group-hover:text-slate-300">${video.channel}</p>
      </div>
    `;
    homeGrid.appendChild(card);
  });
};

const openWatchPage = (video) => {
  homeView.classList.add('hidden');
  homeView.classList.remove('fade-in');
  watchView.classList.remove('hidden');
  watchView.classList.add('fade-in');
  
  navbar.classList.remove('bg-gradient-to-b');
  navbar.classList.add('bg-[#05070a]');
  navbar.style.boxShadow = '0 4px 10px -1px rgba(0, 0, 0, 0.6)';
  btnBack.classList.remove('hidden');
  btnBack.classList.add('fade-in');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('video-player').src = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;
  document.getElementById('watch-title').innerText = video.shortTitle;
  document.getElementById('watch-channel').innerText = video.channel;
  document.getElementById('watch-rating').innerText = generateFakeRating(video.id);
  document.getElementById('watch-duration').innerText = video.duration || '24m';
  document.getElementById('watch-desc').innerText = `${video.title}. Video ini berasal dari ${video.channel} ${video.views ? 'dengan jumlah '+video.views : ''}.`;

  const watchGrid = document.getElementById('watch-grid');
  watchGrid.innerHTML = '';
  
  const relatedVideos = allVideos.filter(v => v.id !== video.id).slice(0, 15); 
  
  relatedVideos.forEach((relVideo, index) => {
    const card = document.createElement('div');
    card.className = "bg-[#0f172a] rounded-lg overflow-hidden cursor-pointer group relative card-hover fade-in border border-slate-800 hover:border-sky-500/30";
    card.style.animationDelay = `${0.3 + (index * 0.05)}s`;
    card.onclick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => openWatchPage(relVideo), 300);
    };
    
    card.innerHTML = `
      <div class="relative aspect-video overflow-hidden bg-slate-900">
        <img src="${relVideo.fallbackThumb}" alt="Thumbnail" class="w-full h-full object-cover group-hover:opacity-50 transition-opacity duration-300">
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div class="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center bg-black/60 transform scale-50 group-hover:scale-100 transition-transform duration-300">
             <i class="fas fa-play text-white text-xs ml-1"></i>
           </div>
        </div>
        <div class="absolute bottom-0 left-0 h-[3px] bg-[#0ea5e9] transition-all duration-500 w-0 group-hover:w-full shadow-[0_0_5px_#0ea5e9]"></div>
      </div>
      <div class="p-3 bg-[#0f172a] transition-colors group-hover:bg-[#1e293b]">
        <h4 class="text-white text-[11px] sm:text-xs md:text-sm font-bold line-clamp-2 leading-tight group-hover:text-sky-300 transition-colors">
          ${relVideo.shortTitle}
        </h4>
        <div class="flex justify-between items-center mt-2">
          <p class="text-slate-500 text-[10px] sm:text-xs">${relVideo.duration || '24m'}</p>
          <i class="fas fa-plus-circle text-slate-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-sky-400"></i>
        </div>
      </div>
    `;
    watchGrid.appendChild(card);
  });
};

const goHome = () => {
  document.getElementById('video-player').src = "";
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderHome();
};

window.addEventListener('scroll', () => {
  const isWatchViewHidden = watchView.classList.contains('hidden');
  if (isWatchViewHidden) { 
    if (window.scrollY > 50) {
      navbar.classList.replace('bg-gradient-to-b', 'bg-[#0a0e17]/95');
      navbar.classList.add('backdrop-blur-md');
      navbar.classList.add('shadow-lg');
    } else {
      navbar.classList.replace('bg-[#0a0e17]/95', 'bg-gradient-to-b');
      navbar.classList.remove('backdrop-blur-md');
      navbar.classList.remove('shadow-lg');
    }
  }
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault(); 
  const query = searchInput.value.trim();
  if (query) {
    document.getElementById('video-player').src = ""; 
    fetchVideos(query);
    searchInput.blur(); 
  }
});

window.addEventListener('DOMContentLoaded', () => {
  fetchVideos('Upin ipin');
});