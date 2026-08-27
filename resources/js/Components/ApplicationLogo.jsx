export default function ApplicationLogo({ className, ...props }) {
    return (
        <img
            src="/images/oshinei-logo.png"
            alt="Oshinei"
            className={className}
            {...props}
        />
    );
}
