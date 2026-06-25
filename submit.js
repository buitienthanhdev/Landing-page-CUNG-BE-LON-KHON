/**
 * submit.js
 * Handles:
 *  1. Popup (modal) open / close
 *  2. Contact-form submission via fetch → submit.php
 *  3. Success / error alert inside the modal
 *  4. Form reset on success
 */
(function () {
  'use strict';

  /* ── Element refs ─────────────────────────────────────────── */
  const popup      = document.getElementById('contactPopup');
  const backdrop   = document.getElementById('contactPopupBackdrop');
  const btnOpen    = document.getElementById('contactPopupOpen');
  const btnClose   = document.getElementById('contactPopupClose');
  const form       = document.getElementById('contact-inner-form');
  const alert      = document.getElementById('form-alert');
  const submitBtn  = document.getElementById('form-submit-btn');
  const btnText    = document.getElementById('form-btn-text');

  /* ── Field refs ────────────────────────────────────────────── */
  const fName    = document.getElementById('f-parent-name');
  const fPhone   = document.getElementById('f-phone');
  const fCompany = document.getElementById('f-company');
  const fEmail = document.getElementById('f-email');
  const fMajor   = document.getElementById('f-major');
  

  /* ── Popup helpers ─────────────────────────────────────────── */
  function openPopup() {
    if (!popup) return;
    popup.setAttribute('aria-hidden', 'false');
    backdrop && backdrop.setAttribute('aria-hidden', 'false');
    popup.classList.add('is-open');
    backdrop && backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Focus first input for accessibility
    setTimeout(() => fName && fName.focus(), 120);
  }

  function closePopup() {
    if (!popup) return;
    popup.setAttribute('aria-hidden', 'true');
    backdrop && backdrop.setAttribute('aria-hidden', 'true');
    popup.classList.remove('is-open');
    backdrop && backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    hideAlert();
    resetForm();
  }

  /* ── Alert helpers ─────────────────────────────────────────── */
  function showAlert(message, isSuccess) {
    if (!alert) return;
    alert.textContent = message;
    alert.style.display = 'block';
    alert.style.background = isSuccess
      ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)'
      : 'linear-gradient(135deg,#fee2e2,#fecaca)';
    alert.style.color = isSuccess ? '#065f46' : '#991b1b';
    alert.style.border = isSuccess ? '1.5px solid #34d399' : '1.5px solid #f87171';
  }

  function hideAlert() {
    if (!alert) return;
    alert.style.display = 'none';
    alert.textContent = '';
  }

  /* ── Form helpers ──────────────────────────────────────────── */
  function setLoading(loading) {
    if (!submitBtn || !btnText) return;
    submitBtn.disabled = loading;
    btnText.textContent = loading ? 'Đang gửi…' : 'Gửi Thông Tin Đăng Ký';
    submitBtn.style.opacity = loading ? '0.7' : '';
    submitBtn.style.cursor  = loading ? 'not-allowed' : '';
  }

  function resetForm() {
    if (form) form.reset();
  }

  /* ── Fetch submission ──────────────────────────────────────── */
  async function submitForm(e) {
    e.preventDefault();
    hideAlert();

    // Build payload — map form field names → PHP expected keys
    const payload = {
      parent_name      : (fName    ? fName.value.trim()    : ''),
      phone     : (fPhone   ? fPhone.value.trim()   : ''),
      company   : (fCompany ? fCompany.value.trim()   : ''),
      email   : (fEmail ? fEmail.value.trim()   : ''),
      major     : (fMajor   ? fMajor.value.trim()   : ''),
      date: (new Date()).toISOString(),

      // company is not a PHP field — attach as additional_info context
      // additional_info  : (fCompany ? fCompany.value.trim() : 'Đăng ký tư vấn'),
      // service_interested: 'Tư vấn chung',   // default — required by PHP
      // email            : '',
      // child_age_group  : '',
    };
    
    // Chuỗi Regex chuẩn để kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Chuển hóa email: loại bỏ khoảng trắng thừa ở 2 đầu (nếu có)
    const emailValue = fEmail ? fEmail.value.trim() : '';
    
    if (!emailValue) {
      showAlert('Vui lòng nhập địa chỉ Email.', false);
      fEmail && fEmail.focus();
      return;
    }
    
    if (!emailRegex.test(emailValue)) {
      showAlert('Định dạng Email không hợp lệ. Vui lòng kiểm tra lại.', false);
      fEmail && fEmail.focus();
      return;
    }
    // Basic client-side validation
    if (!payload.parent_name) {
      showAlert('Vui lòng nhập Họ và Tên Phụ Huynh.', false);
      fName && fName.focus();
      return;
    }
    if (!payload.phone) {
      showAlert('Vui lòng nhập Số Điện Thoại.', false);
      fPhone && fPhone.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://zalo.onecoat.vn/webhook/contact-form', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // Non-JSON body — treat HTTP 2xx as success
        data = { success: response.ok };
      }

      // Accept explicit success flag OR any HTTP 2xx when flag is absent
      const isSuccess = (data.success === true) || (data.success === undefined && response.ok);

      if (isSuccess) {
        showAlert(data.message || 'Đã gửi thành công! Chúng tôi sẽ liên hệ sớm.', true);
        resetForm();
        // Auto-close after 3 s
        setTimeout(closePopup, 3000);
      } else {
        console.error('[submit.js] server error:', data);
        showAlert(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.', false);
      }
    } catch (err) {
      console.error('[submit.js] fetch error:', err);
      showAlert('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.', false);
    } finally {
      setLoading(false);
    }
  }

  /* ── Event wiring ──────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    // Open popup: float button
    if (btnOpen) btnOpen.addEventListener('click', openPopup);

    // Open popup: any link/button pointing to #contact-form
    document.querySelectorAll('a[href="#contact-form"], button[data-open-contact]')
      .forEach(el => el.addEventListener('click', function (e) {
        // Only intercept if popup exists
        if (!popup) return;
        e.preventDefault();
        openPopup();
      }));

    // Close: × button
    if (btnClose) btnClose.addEventListener('click', closePopup);

    // Close: clicking the backdrop
    if (backdrop) backdrop.addEventListener('click', closePopup);

    // Close: Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup && popup.getAttribute('aria-hidden') === 'false') {
        closePopup();
      }
    });

    // Form submit → fetch
    if (form) form.addEventListener('submit', submitForm);
  });

})();
