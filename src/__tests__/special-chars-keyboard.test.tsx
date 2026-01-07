import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SpecialCharactersKeyboard } from '../components/special-chars-keyboard';

describe('SpecialCharactersKeyboard', () => {
  it('displays special character buttons when word contains non-Latin characters', () => {
    const onCharacterClick = vi.fn();
    render(
      <SpecialCharactersKeyboard word="café résumé" onCharacterClick={onCharacterClick} />,
    );

    // Should show buttons for é characters
    const buttons = screen.getAllByRole('button');
    const specialCharButtons = buttons.filter((btn) => btn.textContent === 'é');
    expect(specialCharButtons.length).toBeGreaterThan(0);
  });

  it('does not render when word contains only Latin characters', () => {
    const onCharacterClick = vi.fn();
    const { container } = render(
      <SpecialCharactersKeyboard word="hello world" onCharacterClick={onCharacterClick} />,
    );

    // Should return null (no keyboard rendered)
    expect(container.firstChild).toBeNull();
  });

  it('allows user to click special character button to insert character', async () => {
    const user = userEvent.setup();
    const onCharacterClick = vi.fn();
    render(
      <SpecialCharactersKeyboard word="naïve" onCharacterClick={onCharacterClick} />,
    );

    // Find and click the ï button
    const iButton = screen.getByRole('button', { name: 'ï' });
    await user.click(iButton);

    // Should call onCharacterClick with the character
    expect(onCharacterClick).toHaveBeenCalledTimes(1);
    expect(onCharacterClick).toHaveBeenCalledWith('ï');
  });

  it('displays unique special characters sorted by code point', () => {
    const onCharacterClick = vi.fn();
    render(
      <SpecialCharactersKeyboard word="café naïve résumé" onCharacterClick={onCharacterClick} />,
    );

    // Should show buttons for é, ï (sorted)
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map((btn) => btn.textContent).filter(Boolean);

    // é comes before ï in code points
    const eIndex = buttonTexts.indexOf('é');
    const iIndex = buttonTexts.indexOf('ï');
    expect(eIndex).toBeGreaterThan(-1);
    expect(iIndex).toBeGreaterThan(-1);
    expect(eIndex).toBeLessThan(iIndex);
  });
});
