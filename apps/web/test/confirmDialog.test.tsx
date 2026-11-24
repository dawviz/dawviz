// T-120: hộp thoại xác nhận dùng chung (thay window.confirm): tiêu điểm vào Huỷ, Esc = Huỷ, Tab xoay vòng, xác nhận gọi đúng hàm.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../src/components/ConfirmDialog.tsx';

const mk = (over: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => {
  const onConfirm = vi.fn(), onCancel = vi.fn();
  render(<ConfirmDialog title="Gỡ precomp này?" message="Hoạt hình sẽ mất." confirmLabel="Vẫn gỡ" cancelLabel="Huỷ" onConfirm={onConfirm} onCancel={onCancel} {...over} />);
  return { onConfirm, onCancel };
};

describe('ConfirmDialog', () => {
  it('là alertdialog có tiêu đề và mô tả; tiêu điểm vào nút Huỷ (chọn an toàn)', () => {
    mk();
    const d = screen.getByRole('alertdialog');
    expect(d).toHaveAccessibleName('Gỡ precomp này?');
    expect(d).toHaveAccessibleDescription('Hoạt hình sẽ mất.');
    expect(screen.getByTestId('confirm-dialog-cancel')).toHaveFocus();
  });
  it('Esc và nút Huỷ gọi onCancel, không gọi onConfirm', () => {
    const { onConfirm, onCancel } = mk();
    fireEvent.keyDown(screen.getByTestId('confirm-dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(2); expect(onConfirm).not.toHaveBeenCalled();
  });
  it('nút xác nhận gọi onConfirm', () => {
    const { onConfirm } = mk();
    fireEvent.click(screen.getByTestId('confirm-dialog-ok'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('Tab ở nút cuối quay về nút đầu, Shift+Tab ở nút đầu sang nút cuối (không thoát khỏi hộp thoại)', () => {
    mk();
    const cancel = screen.getByTestId('confirm-dialog-cancel'), ok = screen.getByTestId('confirm-dialog-ok');
    ok.focus(); fireEvent.keyDown(ok, { key: 'Tab' }); expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true }); expect(ok).toHaveFocus();
  });
});
