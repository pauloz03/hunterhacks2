import { useTranslation } from "react-i18next";

export default function UserTypeSelect({ userTypes, selectedUserType, onSelectUserType, onContinue, isSubmitting }) {
  const { t } = useTranslation();

  return (
    <main className="page user-type-page">
      <section className="user-type-content">
        <header className="user-type-header">
          <h1 className="user-type-title">{t("userType.title")}</h1>
          <p className="user-type-subtitle">{t("userType.subtitle")}</p>
        </header>

        <section className="user-type-list" aria-label={t("userType.ariaLabel")}>
          {userTypes.map((type) => {
            const isActive = selectedUserType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                className={`user-type-card ${isActive ? "active" : ""}`}
                onClick={() => onSelectUserType(type.id)}
                aria-pressed={isActive}
              >
                <span aria-hidden className="user-type-icon-wrap">
                  <span className="user-type-icon">{type.icon}</span>
                </span>
                <span className="user-type-copy">
                  <span className="user-type-card-title">{type.title}</span>
                  <span className="user-type-card-subtitle">{type.subtitle}</span>
                </span>
                <span aria-hidden className="user-type-chevron">
                  ›
                </span>
              </button>
            );
          })}
        </section>

        <button
          type="button"
          className="auth-submit-button"
          onClick={onContinue}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.saving") : t("common.continue")}
        </button>
      </section>
    </main>
  );
}
