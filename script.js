
// 1. GET HTML ELEMENTS
const video = document.getElementById("camera");
const startBtn = document.getElementById("startCamera");
const flipBtn = document.getElementById("flipCamera");
const captureBtn = document.getElementById("capture");
const reviewBtn = document.getElementById("review");
const downloadBtn = document.getElementById("download");
const retakeBtn = document.getElementById("retake");
const placeholder = document.getElementById("cameraPlaceholder");
const counter = document.getElementById("photoCounter");
const countdownEl = document.getElementById("countdown");
const flash = document.getElementById("flash");
const statusLed = document.getElementById("statusLed");
const canvas = document.getElementById("photoCanvas");
const ctx = canvas.getContext("2d");
const emptyPreview = document.getElementById("emptyPreview");
const noteInput = document.getElementById("customNote");
const toast = document.getElementById("toast");

// 2. VARIABLES
let cameraStream = null;
let facingMode = "user";
let photos = [];
let isCapturing = false;
let capturedDate = null;
let toastTimeout;

// 3. FILTER
const filterStyle = "sepia(0.12) saturate(0.78) contrast(0.88) brightness(1.08)";

// 4. NOTIFICATION
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

// 5. WAIT
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 6. START CAMERA

 // 6. START CAMERA
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Camera cần HTTPS hoặc localhost!");
    return;
  }

  try {
    // Dừng camera cũ nếu đang hoạt động
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    // Yêu cầu quyền truy cập camera
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 960 }
      }
    });

    // Hiển thị camera
    video.srcObject = cameraStream;
    await video.play();

    // Lật hình camera trước
    video.style.transform =
      facingMode === "user" ? "scaleX(-1)" : "scaleX(1)";

    video.style.filter = filterStyle;

    // Ẩn màn hình chờ
    placeholder.classList.add("hidden");

    // Đổi trạng thái đèn
    statusLed.classList.remove("off");

    startBtn.textContent = "● CAMERA ON";

    showToast("Camera đã sẵn sàng! ♡");

  } catch (error) {
    console.error("Camera error:", error);

    statusLed.classList.add("off");
    startBtn.textContent = "◉ BẬT CAMERA";

    if (error.name === "NotAllowedError") {
      showToast("Bạn đã từ chối quyền camera! Hãy cấp quyền nhé ♡");

    } else if (error.name === "NotFoundError") {
      showToast("Không tìm thấy camera!");

    } else if (error.name === "NotReadableError") {
      showToast("Camera đang được ứng dụng khác sử dụng!");

    } else {
      showToast("Không thể bật camera. Hãy kiểm tra lại!");
    }
  }
}


// 7. FLIP CAMERA
async function flipCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";

  if (cameraStream) {
    await startCamera();
  } else {
    showToast(
      facingMode === "user"
        ? "Đã chọn camera trước"
        : "Đã chọn camera sau"
    );
  }
}

// 8. CAPTURE CAMERA IMAGE
function captureImage() {
  const width = 520;
  const height = 390;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (!vw || !vh) {
    throw new Error("Camera chưa sẵn sàng");
  }

  const targetRatio = width / height;

  let sx = 0, sy = 0, sw = vw, sh = vh;

  if (vw / vh > targetRatio) {
    sw = vh * targetRatio;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / targetRatio;
    sy = (vh - sh) / 2;
  }

  const temp = document.createElement("canvas");
  temp.width = width;
  temp.height = height;

  const tempCtx = temp.getContext("2d");
  tempCtx.filter = filterStyle;

  if (facingMode === "user") {
    tempCtx.translate(width, 0);
    tempCtx.scale(-1, 1);
  }

  tempCtx.drawImage(
    video,
    sx, sy, sw, sh,
    0, 0, width, height
  );

  return temp.toDataURL("image/jpeg", 0.95);
}

// 9. COUNTDOWN
async function countdown() {
  for (let i = 3; i >= 1; i--) {
    countdownEl.textContent = i;
    await sleep(850);
  }

  countdownEl.textContent = "♡";
  await sleep(300);
  countdownEl.textContent = "";
}

// 10. FLASH
function cameraFlash() {
  flash.classList.remove("fire");
  void flash.offsetWidth;
  flash.classList.add("fire");
}

// 11. SHUTTER SOUND
function shutterSound() {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "triangle";

    oscillator.frequency.setValueAtTime(
      1000,
      audio.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      150,
      audio.currentTime + 0.1
    );

    gain.gain.setValueAtTime(
      0.13,
      audio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.13
    );

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.14);

    oscillator.onended = () => audio.close();

  } catch (error) {
    console.log("Audio unavailable");
  }
}

// 12. CAPTURE FOUR PHOTOS
async function captureFourPhotos() {
  if (isCapturing) return;

  if (!cameraStream || video.readyState < 2) {
    showToast("Hãy bật camera trước nhé!");
    return;
  }

  isCapturing = true;
  captureBtn.disabled = true;

  photos = [];
  capturedDate = new Date();

  counter.textContent = "0 / 4";
  downloadBtn.disabled = true;
  retakeBtn.disabled = true;

  try {
    for (let i = 0; i < 4; i++) {
      await countdown();

      photos.push(captureImage());

      counter.textContent = `${photos.length} / 4`;

      cameraFlash();
      shutterSound();

      await sleep(500);
    }

    await createPhotoSheet();

// Mở khóa nút lưu sau khi chụp đủ 4 ảnh
downloadBtn.disabled = false;
retakeBtn.disabled = false;

    showToast("Your memories are ready! ♡");

  } catch (error) {
    console.error(error);
    showToast("Có lỗi khi chụp ảnh. Thử lại nhé!");

  } finally {
    isCapturing = false;
    captureBtn.disabled = false;
  }
}

// 13. LOAD IMAGE
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;

    image.src = src;
  });
}

// 14. ROUNDED RECTANGLE
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// 15. CREATE PHOTO SHEET 2 X 2
async function createPhotoSheet() {
  if (photos.length !== 4) return;

  const W = 700;
  const H = 900;

  canvas.width = W;
  canvas.height = H;

  canvas.hidden = false;
  emptyPreview.hidden = true;

  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#e5dfd3";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, W - 16, H - 16);

  const margin = 34;
  const gap = 12;

  const photoW = (W - margin * 2 - gap) / 2;
  const photoH = 300;
  const startY = 32;

  for (let i = 0; i < 4; i++) {
    const image = await loadImage(photos[i]);

    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = margin + col * (photoW + gap);
    const y = startY + row * (photoH + gap);

    ctx.save();

    roundedRect(ctx, x, y, photoW, photoH, 4);
    ctx.clip();

    ctx.drawImage(image, x, y, photoW, photoH);

    ctx.restore();

    ctx.strokeStyle = "#e4ddd2";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, photoW, photoH);
  }

  // PERSONAL MESSAGE
  const footerY = 680;

  const note =
    noteInput.value.trim() || "For my favorite person ♥";

  ctx.textAlign = "center";
  ctx.fillStyle = "#667b91";
  ctx.font = "500 54px Caveat, cursive";

  ctx.fillText(note, W / 2, footerY + 65, W - 70);

  // DATE
  const date = formatDate(capturedDate || new Date());

  ctx.fillStyle = "#45576a";
  ctx.font = "600 17px Quicksand, sans-serif";

  ctx.fillText(
    `CAPTURED ON ${date}  ·  ♥`,
    W / 2,
    footerY + 108
  );

  // FOOTER
  ctx.fillStyle = "#a1b2c0";
  ctx.font = "500 15px Quicksand, sans-serif";

  ctx.fillText(
    "OUR LITTLE PHOTOBOOTH",
    W / 2,
    footerY + 150
  );
}

// 16. FORMAT DATE
function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();

  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${d} ${m} ${y} · ${h}:${min}`;
}


 // 17. DOWNLOAD PHOTO - MOBILE & COMPUTER
async function downloadPhoto() {
  try {
    if (photos.length !== 4) {
      showToast("Bạn cần chụp đủ 4 ảnh trước nhé! ♡");
      return;
    }

    // Tạo file PNG từ ảnh đã ghép
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error("Không tạo được ảnh PNG"));
      }, "image/png");
    });

    const file = new File(
      [blob],
      "Our-Little-Photobooth.png",
      { type: "image/png" }
    );

    // PHÁT HIỆN ĐIỆN THOẠI
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 1. ĐIỆN THOẠI: MỞ BẢNG CHIA SẺ
    if (
      isMobile &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "Our Little Photobooth",
        text: "Our little memories ♡"
      });

      showToast("Hãy chọn Lưu hình ảnh vào thư viện nhé! ♡");
      return;
    }

    // 2. MÁY TÍNH: CHỌN THƯ MỤC LƯU ẢNH
    if (!isMobile && window.showDirectoryPicker) {
      try {
        const directory = await window.showDirectoryPicker({
          id: "photobooth-images",
          mode: "readwrite",
          startIn: "pictures"
        });

        const fileHandle = await directory.getFileHandle(
          "Our-Little-Photobooth.png",
          { create: true }
        );

        const writable = await fileHandle.createWritable();

        await writable.write(blob);
        await writable.close();

        showToast("Đã lưu ảnh vào thư mục thành công! ♡");
        return;

      } catch (error) {
        if (error.name === "AbortError") {
          showToast("Bạn đã hủy chọn thư mục lưu ảnh.");
          return;
        }

        console.error("Folder save error:", error);
      }
    }

    // 3. DỰ PHÒNG: TẢI ẢNH VỀ DOWNLOADS
    const imageURL = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = imageURL;
    link.download = "Our-Little-Photobooth.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(imageURL);
    }, 3000);

    showToast("Đã tải ảnh về máy thành công! ♡");

  } catch (error) {
    console.error("Save image error:", error);
    showToast("Không thể lưu ảnh. Bạn hãy thử lại nhé!");
  }
}


// 18. REVIEW PHOTO
function reviewPhoto() {
  if (photos.length !== 4) {
    showToast("Bạn cần chụp đủ 4 ảnh trước nhé!");
    return;
  }

  document.querySelector(".preview-section").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  showToast("Đây là kỷ niệm của bạn ♡");
}

// 19. RETAKE
function retakePhoto() {
  photos = [];
  capturedDate = null;

  canvas.hidden = true;
  emptyPreview.hidden = false;

  counter.textContent = "0 / 4";

  downloadBtn.disabled = true;
  retakeBtn.disabled = true;

  showToast("Sẵn sàng chụp bộ ảnh mới! ♡");
}

// 20. UPDATE PERSONAL NOTE
noteInput.addEventListener("input", async () => {
  if (photos.length === 4) {
    await createPhotoSheet();
  }
});

// 21. EVENT LISTENERS
startBtn.addEventListener("click", startCamera);
flipBtn.addEventListener("click", flipCamera);
captureBtn.addEventListener("click", captureFourPhotos);
reviewBtn.addEventListener("click", reviewPhoto);
downloadBtn.addEventListener("click", downloadPhoto);
retakeBtn.addEventListener("click", retakePhoto);


 // 23. INITIALIZE
counter.textContent = "0 / 4";
statusLed.classList.add("off");

// Tự động yêu cầu quyền camera khi vào web
startCamera();

