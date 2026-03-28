(function () {
  const ENDPOINT = 'https://api.web3forms.com/submit';

  function buildVehicleBlock() {
    const car = window.currentCar;
    if (!car) return '';
    const line = [
      '--- Vehicle ---',
      `${car.make} ${car.model} — ${car.variant || ''}`.trim(),
      `Listing ID: ${car.id}`,
      `Price: £${typeof car.price === 'number' ? car.price.toLocaleString() : car.price}`,
      `Page: ${window.location.href}`
    ].join('\n');
    return '\n\n' + line;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const hp = form.querySelector('.enquiry-hp');
    if (hp && hp.value) return;
    const key = window.D3_ENQUIRY && window.D3_ENQUIRY.web3formsAccessKey;
    const submitBtn = form.querySelector('button[type="submit"]');
    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    const phone = form.querySelector('[name="phone"]');
    const message = form.querySelector('[name="message"]');

    if (!key || !String(key).trim()) {
      if (typeof window.showToast === 'function') {
        window.showToast('Enquiry email is not set up yet. Add your Web3Forms key in js/enquiry-config.js');
      } else {
        alert('Enquiry email is not set up yet. Add your Web3Forms key in js/enquiry-config.js');
      }
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const messageText = (message && message.value) || '';
    const fullMessage = messageText.trim() + buildVehicleBlock();

    const payload = {
      access_key: key.trim(),
      subject: (function () {
        const car = window.currentCar;
        if (car) return `New enquiry — ${car.make} ${car.model} (Driven3)`;
        return 'New vehicle enquiry (Driven3 Automotive)';
      })(),
      name: name.value.trim(),
      email: email.value.trim(),
      phone: (phone && phone.value.trim()) || '',
      message: fullMessage
    };

    const prevLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(function () {
        return {};
      });
      if (data.success) {
        form.reset();
        if (typeof window.showToast === 'function') {
          window.showToast("✅ Enquiry sent! We'll be in touch shortly.");
        }
      } else {
        const err = (data && data.message) || 'Could not send. Try again or call us.';
        if (typeof window.showToast === 'function') {
          window.showToast(err);
        } else {
          alert(err);
        }
      }
    } catch (err) {
      console.warn('Enquiry submit failed', err);
      if (typeof window.showToast === 'function') {
        window.showToast('Network error. Check your connection and try again.');
      } else {
        alert('Network error. Check your connection and try again.');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevLabel;
      }
    }
  }

  const form = document.getElementById('listingEnquiryForm');
  if (form) form.addEventListener('submit', handleSubmit);
})();
