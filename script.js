// Danh sách giải thưởng khớp theo thứ tự các ô trên ảnh của bạn từ góc 0 độ
const prizes = ["10%", "20%", "30%", "50%", "70%"]; 

const wheelImage = document.getElementById("wheelImage");
let isSpinning = false;

window.onload = function() {
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        spinBtn.onclick = startSpin;
    }

    // Kiểm tra chặn thiết bị dựa trên bộ khóa riêng của web thứ hai
    const deviceHasSpun = localStorage.getItem('stopest_v2_device_spun');
    const savedPrize = localStorage.getItem('stopest_v2_device_prize');

    if (deviceHasSpun === 'true') {
        if (document.getElementById('input-fields')) document.getElementById('input-fields').style.display = 'none';
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.innerText = "ĐÃ HẾT LƯỢT QUAY";
        }
        if (document.getElementById('status-message')) document.getElementById('status-message').innerText = "Thiết bị của bạn đã tham gia chương trình này rồi!";
        if (document.getElementById('result-text')) document.getElementById('result-text').innerText = savedPrize;
        if (document.getElementById('result-box')) document.getElementById('result-box').classList.remove('hidden');
    }
};

function startSpin() {
    if (isSpinning) return;

    if (localStorage.getItem('stopest_v2_device_spun') === 'true') {
        alert("Thiết bị này đã hết lượt quay!");
        return;
    }

    const nameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');
    const fullname = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!fullname || !phone) {
        alert("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!");
        return;
    }
    if (!/^\d{9,11}$/.test(phone)) {
        alert("Số điện thoại không hợp lệ!");
        return;
    }

    // Kiểm tra chặn số điện thoại trùng lặp
    let usedPhones = JSON.parse(localStorage.getItem('stopest_v2_used_phones')) || [];
    if (usedPhones.includes(phone)) {
        alert("Số điện thoại này đã tham gia quay thưởng trước đó rồi!");
        return;
    }

    isSpinning = true;
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.disabled = true;

    // Thuật toán tính xác suất: 15% trúng ô 70% (nằm ở index cuối cùng - số 4)
    const rand = Math.floor(Math.random() * 100) + 1;
    let prizeIndex = 0;

    if (rand <= 15) {
        prizeIndex = 4; // Ô 70%
    } else {
        const remainders = [0, 1, 2, 3]; // Phân bổ ngẫu nhiên 85% còn lại cho các ô khác
        prizeIndex = remainders[Math.floor(Math.random() * remainders.length)];
    }
    
    // Tính toán góc quay cho hệ 5 ô (Mỗi ô rộng 72 độ) để tâm ô dừng đúng kim chỉ đỉnh (270 độ)
    const targetAngleDegree = 270 - (prizeIndex * 72 + 36);
    const totalRotation = 2880 + targetAngleDegree; // Quay đủ 8 vòng rồi dừng chính xác

    if (wheelImage) {
        wheelImage.style.transform = `rotate(${totalRotation}deg)`;
    }

    setTimeout(() => {
        const finalPrize = prizes[prizeIndex];
        const displayPrize = "Ưu đãi " + finalPrize;
        
        if (document.getElementById('result-text')) document.getElementById('result-text').innerText = displayPrize;
        if (document.getElementById('result-box')) document.getElementById('result-box').classList.remove('hidden');
        if (spinBtn) spinBtn.innerText = "ĐÃ HẾT LƯỢT QUAY";
        if (document.getElementById('status-message')) document.getElementById('status-message').innerText = "Chúc mừng bạn đã trúng giải!";
        if (document.getElementById('input-fields')) document.getElementById('input-fields').style.display = 'none';

        // Lưu thông tin chặn thiết bị
        localStorage.setItem('stopest_v2_device_spun', 'true');
        localStorage.setItem('stopest_v2_device_prize', displayPrize);

        // Lưu thông tin chặn số điện thoại
        usedPhones.push(phone);
        localStorage.setItem('stopest_v2_used_phones', JSON.stringify(usedPhones));

        // Gửi dữ liệu đồng bộ lên Google Form
        sendDataToGoogle(fullname, phone, finalPrize);
        isSpinning = false;
    }, 4000); 
}

function sendDataToGoogle(name, phone, prize) {
    const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeboYa4TZbA28yF3Tnlf_EVdLgy7tYRNxIIOpLJjYtqJVNIbQ/formResponse";
    const prizeText = "Ưu đãi " + prize; 
    const finalUrl = `${baseUrl}?entry.810076137=${encodeURIComponent(name)}&entry.1928279920=${encodeURIComponent(phone)}&entry.2010302772=${encodeURIComponent(prizeText)}&submit=Submit`;

    const newWindow = window.open(finalUrl, '_blank');
    if (newWindow) {
        setTimeout(() => {
            newWindow.close();
        }, 600); 
    }
}
