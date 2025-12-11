import './ContactButtons.css';

const ContactButtons = ({ person }) => {
  const handlePhoneClick = () => {
    window.open(`tel:${person.phone}`, '_self');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${person.email}`, '_self');
  };

  const handleLocationClick = () => {
    const loc = person.location?.trim();
    if (!loc) return;
  
    // Si ya es una URL absoluta (empieza con http/https)
    if (/^https?:\/\//i.test(loc)) {
      window.open(loc, '_blank', 'noopener,noreferrer');
    } else {
      // Si es texto de dirección
      const encoded = encodeURIComponent(loc);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank', 'noopener,noreferrer');
    }
  };
  

  const handleWebsiteClick = () => {
    window.open(person.website, '_blank');
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hello ${person.name}, I’d like to get in touch with you.`);
    window.open(`https://wa.me/${person.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleLinkedInClick = () => {
    window.open(person.linkedin, '_blank');
  };

  const handleWeChatClick = () => {
    const raw = person.wechat?.trim();
    if (!raw) return;

    const isDeepLink = /^https?:\/\//i.test(raw) || raw.startsWith("weixin://");
    const url = isDeepLink ? raw : `weixin://dl/chat?${encodeURIComponent(raw)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCalendarClick = () => {
    // prioriza URL absoluta si existe (cal.com, meet.jasu.us, etc.)
    const raw =
      person.calUrl?.trim() ||
      person.calendar?.trim() ||
      (person.calUsername ? `https://cal.com/${person.calUsername.replace(/^@/, '')}` : null);

    if (!raw) return;

    // si ya es absoluta, úsala; si no, asúmela como https://
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="contact-buttons">
      <div className="contact-row">
        <button className="contact-btn primary" onClick={handlePhoneClick} title="Call" type="button" aria-label="Call">
          <span className="material-symbols-rounded icon-lg">call</span>
        </button>

        <button className="contact-btn primary" onClick={handleEmailClick} title="Send email" type="button" aria-label="Send email">
          <span className="material-symbols-rounded icon-lg">mail</span>
        </button>

        <button className="contact-btn primary" onClick={handleLocationClick} title="See location" type="button" aria-label="See location">
          <span className="material-symbols-rounded icon-lg">location_on</span>
        </button>

        <button className="contact-btn primary" onClick={handleWebsiteClick} title="Visit website" type="button" aria-label="Visit website">
          <span className="material-symbols-rounded icon-lg">captive_portal</span>
        </button>
      </div>

      <div className="contact-row">
        {person.whatsapp && (
          <button
            className="contact-btn whatsapp"
            onClick={handleWhatsAppClick}
            title="Send WhatsApp"
            aria-label="Enviar WhatsApp"
            type="button"
          >
            <svg className="icon-whatsapp" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path fill="#ffffff" d="M16 .396c-8.817 0-15.96 7.143-15.96 15.96 0 2.812.734 5.557 2.13 7.977L.39 31.603l7.46-2.156a15.9 15.9 0 007.977 2.13c8.818 0 15.96-7.144 15.96-15.96S24.817.396 16 .396zm0 28.917a12.9 12.9 0 01-6.59-1.807l-.471-.28-4.425 1.278 1.273-4.42-.29-.471A12.9 12.9 0 013.084 16c0-7.121 5.795-12.917 12.916-12.917 7.122 0 12.917 5.796 12.917 12.917S23.122 29.313 16 29.313zm7.108-9.693c-.39-.195-2.308-1.139-2.666-1.27-.358-.132-.618-.195-.879.196-.26.39-1.008 1.27-1.236 1.53-.228.26-.455.293-.845.098-.39-.196-1.646-.607-3.136-1.937-1.159-1.035-1.942-2.314-2.17-2.705-.228-.39-.024-.6.172-.794.177-.176.39-.455.585-.682.196-.228.26-.39.39-.65.13-.26.065-.487-.033-.683-.098-.195-.879-2.119-1.205-2.902-.318-.764-.64-.66-.879-.672l-.75-.013c-.26 0-.682.098-1.04.487-.357.39-1.364 1.333-1.364 3.257s1.397 3.78 1.592 4.04c.195.26 2.753 4.204 6.675 5.889.934.403 1.662.643 2.233.822.938.3 1.792.258 2.465.156.751-.112 2.308-.937 2.63-1.84.325-.9.325-1.648.228-1.808-.098-.16-.357-.26-.75-.455z"/>
            </svg>
          </button>
        )}

        {person.wechat && (
          <button
            className="contact-btn wechat"
            onClick={handleWeChatClick}
            title="WeChat"
            aria-label="Abrir WeChat"
            type="button"
          >
            <svg className="icon-wechat" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path
                fill="#ffffff"
                d="M22.667 12.667c-3.681 0-6.667 2.603-6.667 5.819 0 2.017 1.214 3.784 3.068 4.847-.107.402-.298 1.116-.347 1.32-.054.231.077.228.162.167.067-.048 1.211-.832 1.699-1.169.659.167 1.361.254 2.085.254 3.681 0 6.667-2.603 6.667-5.819S26.348 12.667 22.667 12.667zm-2 3.333a.833.833 0 11.001-1.667.833.833 0 01-.001 1.667zm4 0a.833.833 0 11.001-1.667.833.833 0 01-.001 1.667zm-8-7c0-3.216-2.986-5.819-6.667-5.819S3.333 5.784 3.333 9c0 2.017 1.214 3.784 3.068 4.847-.107.402-.298 1.116-.347 1.32-.054.231.077.228.162.167.067-.048 1.211-.832 1.699-1.169.659.167 1.361.254 2.085.254.66 0 1.296-.081 1.893-.228a7.116 7.116 0 013.397-4.006 4.92 4.92 0 01-.027-.488zM8.667 6.667a.833.833 0 11.001-1.667.833.833 0 01-.001 1.667zm4 0a.833.833 0 11.001-1.667.833.833 0 01-.001 1.667z"
              />
            </svg>
          </button>
        )}

        {person.linkedin && (
          <button className="contact-btn linkedin" onClick={handleLinkedInClick} title="See LinkedIn" aria-label="Ver LinkedIn" type="button">
            <svg className="icon-linkedin" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M20.447 20.452H16.893V14.883C16.893 13.555 16.866 11.846 15.041 11.846C13.188 11.846 12.905 13.291 12.905 14.785V20.452H9.351V9H12.765V10.561H12.811C13.288 9.661 14.448 8.711 16.181 8.711C19.782 8.711 20.448 11.081 20.448 14.166V20.452H20.447ZM5.337 7.433C4.193 7.433 3.274 6.507 3.274 5.368C3.274 4.23 4.194 3.305 5.337 3.305C6.477 3.305 7.401 4.23 7.401 5.368C7.401 6.507 6.476 7.433 5.337 7.433ZM7.119 20.452H3.555V9H7.119V20.452ZM22.225 0H1.771C0.792 0 0 0.774 0 1.729V22.271C0 23.227 0.792 24 1.771 24H22.222C23.2 24 24 23.227 24 22.271V1.729C24 0.774 23.2 0 22.222 0H22.225Z" fill="currentColor"/>
            </svg>
          </button>
        )}

        {(person.calUrl || person.calUsername || person.calendar) && (
          <button
            className="contact-btn calendar"
            onClick={handleCalendarClick}
            title="Schedule a meeting"
            aria-label="Agendar cita"
            type="button"
          >
            <span className="material-symbols-rounded icon-lg">calendar_month</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ContactButtons;
