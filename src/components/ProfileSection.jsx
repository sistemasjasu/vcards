import './ProfileSection.css';

const ProfileSection = ({ person }) => {
  return (
    <div className="profile-section">
      <div className="profile-image-container">
        <img 
          src={person.profileImage} 
          alt={person.name}
          className="profile-image"
        />
      </div>
      <h1 className="name">{person.name}</h1>
      <h2 className="title"><strong>{person.title}</strong></h2>
      <p className="address"><strong>Office:</strong> {person.address}</p>
      <p className="address"><strong>Phone:</strong> {person.phone}</p>
      <p className="address"><strong>Email:</strong> {person.email}</p>
    </div>
  );
};

export default ProfileSection;
