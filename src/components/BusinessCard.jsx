import { useState, useEffect } from 'react';
import Header from './Header';
import ProfileSection from './ProfileSection';
import ContactButtons from './ContactButtons';
import QRCode from './QRCode';
import { generateVCard } from '../utils/vcard';
import './BusinessCard.css';

const BusinessCard = ({ person }) => {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleSaveContact = () => {
    const vcard = generateVCard(person);
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${person.name.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${person.name} - ${person.title}`,
          text: `Conoce a ${person.name}`,
          url: currentUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        alert('Enlace copiado al portapapeles');
      });
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <div className="business-card">
      <Header onShare={handleShare} />
      <ProfileSection person={person} />
      <div className="separator" />
      <button className="save-contact-btn" onClick={handleSaveContact}>
      <span className="material-symbols-rounded" aria-hidden="true">person_add</span>
        Save contact
      </button>
      <ContactButtons person={person} />
      <div className="separator" />
      <QRCode url={currentUrl} filename={`${person.id || "jasu"}-qr`} />
    </div>
  );
};

export default BusinessCard;
