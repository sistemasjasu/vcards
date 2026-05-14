import './ProfileSection.css';

const digitsOnly = (v) => String(v ?? "").replace(/\D/g, "");

const ProfileSection = ({ person }) => {
  const showMobile =
    person.whatsapp &&
    person.phone &&
    digitsOnly(person.whatsapp) !== digitsOnly(person.phone);

  return (
    <div className="profile-section">
      <div className="profile-image-container">
        <img 
          src={person.profileImage} 
          alt={person.name}
          className="profile-image"
          referrerPolicy="no-referrer" 
          crossOrigin="anonymous"
        />
      </div>
      <h1 className="name">{person.name}</h1>
      {person.title?.trim() ? (
        <h2 className="title"><strong>{person.title}</strong></h2>
      ) : null}
      <p className="address"><strong>Office:</strong> {person.address}</p>
      <p className="address"><strong>Phone:</strong> {person.phone}</p>
      {showMobile ? (
        <p className="address"><strong>Mobile:</strong> {person.whatsapp}</p>
      ) : null}
      <p className="address"><strong>Email:</strong> {person.email}</p>
    </div>
  );
};

export default ProfileSection;
