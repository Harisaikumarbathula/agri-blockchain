import { useEffect, useRef, useState } from "react";
import Alert from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { extractErrorMessage, formatDate } from "../utils/formatters";

function createProfileForm(user) {
  return {
    profilePhoto: user?.profilePhoto || "",
    name: user?.name || "",
    phoneExtension: user?.phoneExtension || "+91",
    phone: user?.phone || "",
    email: user?.email || "",
    role: user?.role || "buyer",
    place: user?.address?.place || user?.address?.village || user?.address?.district || "",
    state: user?.address?.state || "",
    country: user?.address?.country || "",
    bio: user?.bio || "",
  };
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "AC";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function formatRoleLabel(role) {
  if (!role) {
    return "Buyer";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function buildLocationLabel(formData) {
  return [formData.place, formData.state, formData.country].filter(Boolean).join(", ") || "Add your address";
}

function buildPhoneLabel(formData) {
  return [formData.phoneExtension, formData.phone].filter(Boolean).join(" ") || "Add your phone number";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process the selected image."));
    image.src = source;
  });
}

async function optimizeProfilePhoto(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file for the profile photo.");
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxDimension = 720;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not supported in this browser.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(outputType, outputType === "image/png" ? undefined : 0.82);
}

export default function ProfilePage() {
  const fileInputRef = useRef(null);
  const { user, updateProfile, loading } = useAuth();
  const [formData, setFormData] = useState(() => createProfileForm(user));
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  useEffect(() => {
    setFormData(createProfileForm(user));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setError("");
    setMessage("");
  };

  const handlePhotoSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsEditing(true);
    setIsPhotoProcessing(true);

    try {
      const profilePhoto = await optimizeProfilePhoto(file);
      setFormData((current) => ({ ...current, profilePhoto }));
      setMessage("Photo updated. Save changes to keep it on your profile.");
    } catch (photoError) {
      setError(extractErrorMessage(photoError));
    } finally {
      setIsPhotoProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      phoneExtension: formData.phoneExtension.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      role: formData.role,
      bio: formData.bio.trim(),
      profilePhoto: formData.profilePhoto,
      address: {
        place: formData.place.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
      },
    };

    if (!payload.name || !payload.phoneExtension || !payload.phone || !payload.email || !payload.address.place || !payload.address.state || !payload.address.country) {
      setError("Please complete all required profile fields before saving.");
      setMessage("");
      return;
    }

    if (!/^\+?[0-9]{1,4}$/.test(payload.phoneExtension)) {
      setError("Please enter a valid mobile extension.");
      setMessage("");
      return;
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(payload.phone)) {
      setError("Please enter a valid phone number.");
      setMessage("");
      return;
    }

    if (!isEditing) {
      setMessage("Profile is already up to date.");
      setError("");
      return;
    }

    try {
      const updatedUser = await updateProfile(payload);
      setFormData(createProfileForm(updatedUser));
      setIsEditing(false);
      setError("");
      setMessage("Profile updated successfully.");
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
      setMessage("");
    }
  };

  const isBusy = loading || isPhotoProcessing;
  const isAdmin = user?.role === "admin";

  return (
    <section className="stack" style={{ gap: "2.5rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem", flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
            Account Details
          </div>
          <h1 style={{ fontSize: "3rem", marginBottom: "0.6rem", letterSpacing: "-0.04em", color: "var(--color-text)" }}>Profile</h1>
          <p style={{ color: "var(--color-muted)", fontWeight: "500", fontSize: "1.05rem", maxWidth: "640px" }}>
            Keep your marketplace identity current so buyers and farmers always see the right details.
          </p>
        </div>

        <div className="profile-actions">
          <button type="button" className="btn btn--secondary" onClick={handleEditProfile} disabled={isEditing || isBusy}>
            Edit Profile
          </button>
          <button type="submit" form="profile-form" className="btn btn--primary" disabled={!isEditing || isBusy}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      {error && <Alert type="danger" message={error} />}
      {message && <Alert type="success" message={message} />}

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="card profile-sidebar-card stack">
            <div className="profile-photo-shell">
              <div className="profile-photo">
                {formData.profilePhoto ? <img src={formData.profilePhoto} alt={`${formData.name || "User"} profile`} /> : <span>{getInitials(formData.name)}</span>}
              </div>

              <div className="stack" style={{ gap: "0.35rem", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1.7rem", color: "var(--color-text)" }}>{formData.name || "Your profile"}</h2>
                <span className={`badge badge--${formData.role === "farmer" ? "success" : formData.role === "admin" ? "info" : "warning"}`}>
                  {formatRoleLabel(formData.role)}
                </span>
              </div>

              <button type="button" className="btn btn--ghost" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
                {formData.profilePhoto ? "Edit Photo" : "Upload Photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoSelection}
              />
              <p className="profile-photo-hint">Upload a clear profile photo. We resize it automatically for a faster, cleaner profile card.</p>
            </div>

            <div className="profile-meta-list">
              <div className="profile-meta-card">
                <span>Phone Number</span>
                <strong>{buildPhoneLabel(formData)}</strong>
              </div>
              <div className="profile-meta-card">
                <span>Email ID</span>
                <strong>{formData.email || "Add your email address"}</strong>
              </div>
              <div className="profile-meta-card">
                <span>Address</span>
                <strong>{buildLocationLabel(formData)}</strong>
              </div>
              <div className="profile-meta-card">
                <span>Member Since</span>
                <strong>{formatDate(user?.createdAt)}</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="card profile-form-card">
          <div className="profile-form-head">
            <h2 style={{ margin: 0, fontSize: "1.85rem", color: "var(--color-text)" }}>Profile Information</h2>
            <p style={{ margin: "0.75rem 0 0", color: "var(--color-muted)", fontWeight: "500", maxWidth: "700px" }}>
              Review your core contact details, update your role, and add a short bio so others understand who you are in the network.
            </p>
          </div>

          <div className="profile-form-body">
            <form id="profile-form" className="form-grid" onSubmit={handleSubmit}>
              <div className="profile-summary">
                <div className="profile-summary__item">
                  <span>Status</span>
                  <strong>{isEditing ? "Editing in progress" : "Saved and synced"}</strong>
                </div>
                <div className="profile-summary__item">
                  <span>Marketplace Role</span>
                  <strong>{formatRoleLabel(formData.role)}</strong>
                </div>
                <div className="profile-summary__item">
                  <span>Location Preview</span>
                  <strong>{buildLocationLabel(formData)}</strong>
                </div>
              </div>

              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Asha Patel"
                  disabled={!isEditing}
                  required
                />
              </label>

              <div className="profile-address-grid">
                <label>
                  <span>Place</span>
                  <input
                    type="text"
                    name="place"
                    value={formData.place}
                    onChange={handleChange}
                    placeholder="e.g. Hyderabad"
                    disabled={!isEditing}
                    required
                  />
                </label>

                <label>
                  <span>State</span>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Telangana"
                    disabled={!isEditing}
                    required
                  />
                </label>

                <label>
                  <span>Country</span>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. India"
                    disabled={!isEditing}
                    required
                  />
                </label>
              </div>

              <div className="profile-contact-grid">
                <label>
                  <span>Mobile Extension</span>
                  <input
                    type="tel"
                    name="phoneExtension"
                    value={formData.phoneExtension}
                    onChange={handleChange}
                    placeholder="+91"
                    disabled={!isEditing}
                    required
                  />
                </label>

                <label>
                  <span>Phone Number</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    disabled={!isEditing}
                    required
                  />
                </label>

                <label>
                  <span>Email ID</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    disabled={!isEditing}
                    required
                  />
                </label>
              </div>

              <label>
                <span>Role</span>
                <select name="role" value={formData.role} onChange={handleChange} disabled={!isEditing || isAdmin} required>
                  {isAdmin ? (
                    <option value="admin">Admin</option>
                  ) : (
                    <>
                      <option value="buyer">Buyer</option>
                      <option value="farmer">Farmer</option>
                    </>
                  )}
                </select>
              </label>

              <label>
                <span>Bio (optional)</span>
                <textarea
                  className="profile-textarea"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell other participants a little about your farm, sourcing preferences, or what you trade."
                  disabled={!isEditing}
                  maxLength={280}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem", fontWeight: "500" }}>
                  {isAdmin ? "Admin role is managed separately and can be reviewed here only." : "Switch between buyer and farmer if your marketplace role changes."}
                </p>
                <span style={{ color: "var(--color-muted)", fontSize: "0.9rem", fontWeight: "600" }}>
                  {formData.bio.length}/280
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
