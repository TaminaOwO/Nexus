interface CatLabErrorProps {
  message?: string
}

export default function CatLabError({ message }: CatLabErrorProps) {
  const displayMessage = message ?? 'Unable to load CatLab content. Please try again later.'

  return (
    <div
      data-testid="error-container"
      className="bg-error-subtle border border-error rounded-md p-6 text-center"
    >
      <p className="font-mono text-2xl text-error mb-2">!</p>
      <p className="text-sm text-text-secondary">{displayMessage}</p>
    </div>
  )
}
