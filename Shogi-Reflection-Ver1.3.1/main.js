import { AddCurrentPositionToKeyPosition } from "./AddCurrentPositionToKeyPosition.js";
import { BrowserClipboardAdapter } from "./BrowserClipboardAdapter.js";
import { BrowserKifClipboardAdapter } from "./BrowserKifClipboardAdapter.js";
import { BrowserFileAdapter } from "./BrowserFileAdapter.js";
import { BrowserMarkdownExportView } from "./BrowserMarkdownExportView.js";
import { BrowserShogiReplayView } from "./BrowserShogiReplayView.js";
import { BrowserKifImportView } from "./BrowserKifImportView.js";
import { KifFileReaderAdapter } from "./KifFileReaderAdapter.js";
import { KifImportApplicationService } from "./KifImportApplicationService.js";
import { KifImportController } from "./KifImportController.js";
import { KifImportErrorPresenter } from "./KifImportErrorPresenter.js";
import { KifImportFormMapper } from "./KifImportFormMapper.js";
import { KifImportPreviewPresenter } from "./KifImportPreviewPresenter.js";
import { KifParser } from "./KifParser.js";
import { KifPastedTextAdapter } from "./KifPastedTextAdapter.js";
import { KeyPositionReplayController } from "./KeyPositionReplayController.js";
import { KeyPositionReplayViewModel } from "./KeyPositionReplayViewModel.js";
import { PiyoShogiCompatibility } from "./PiyoShogiCompatibility.js";
import { PositionHistoryBuilder } from "./PositionHistoryBuilder.js";
import { BrowserGameReviewFormView } from "./BrowserGameReviewFormView.js";
import { BrowserGameReviewLibraryView } from "./BrowserGameReviewLibraryView.js";
import { DeleteGameReview } from "./DeleteGameReview.js";
import { DeleteGameReviewAndPersist } from "./DeleteGameReviewAndPersist.js";
import { ExportGameReviewAsMarkdown } from "./ExportGameReviewAsMarkdown.js";
import { ExportObservationCardAsMarkdown } from "./ExportObservationCardAsMarkdown.js";
import { GameReviewEditMapper } from "./GameReviewEditMapper.js";
import { GameReviewFormMapper } from "./GameReviewFormMapper.js";
import { GameReviewLibraryPresenter } from "./GameReviewLibraryPresenter.js";
import { GameReviewMarkdownFormatter } from "./GameReviewMarkdownFormatter.js";
import { GameReviewSnapshotService } from "./GameReviewSnapshotService.js";
import { GetGameReview } from "./GetGameReview.js";
import { InMemoryGameReviewRepository } from "./InMemoryGameReviewRepository.js";
import { ListGameReviews } from "./ListGameReviews.js";
import { LocalStorageSnapshotStore } from "./LocalStorageSnapshotStore.js";
import { MarkdownExportController } from "./MarkdownExportController.js";
import { ObservationCardMarkdownFormatter } from "./ObservationCardMarkdownFormatter.js";
import { ReflectionBackupController } from "./ReflectionBackupController.js";
import { ReflectionPersistenceCoordinator } from "./ReflectionPersistenceCoordinator.js";
import { ReviewIdGenerator } from "./ReviewIdGenerator.js";
import { SaveGameReview } from "./SaveGameReview.js";
import { ShogiReplayApplicationService } from "./ShogiReplayApplicationService.js";
import { ShogiReplayController } from "./ShogiReplayController.js";
import { ShogiReplayViewModel } from "./ShogiReplayViewModel.js";
import { SubmitGameReviewForm } from "./SubmitGameReviewForm.js";

const repository = new InMemoryGameReviewRepository();
const snapshotService = new GameReviewSnapshotService({ repository });
const snapshotStore = new LocalStorageSnapshotStore({ storage: window.localStorage });
const persistenceCoordinator = new ReflectionPersistenceCoordinator({ snapshotService, snapshotStore });
const backupController = new ReflectionBackupController({ persistenceCoordinator });
const listGameReviews = new ListGameReviews({ repository });
const getGameReview = new GetGameReview({ repository });
const reviewIdGenerator = new ReviewIdGenerator();
const keyPositionReplayViewModel = new KeyPositionReplayViewModel();
const formView = new BrowserGameReviewFormView({ snapshotViewModel: keyPositionReplayViewModel });
const kifImportView = new BrowserKifImportView();
const kifParser = new KifParser();
const kifImportController = new KifImportController({
  importService: new KifImportApplicationService({
    fileReader: new KifFileReaderAdapter(),
    parser: kifParser,
    compatibility: new PiyoShogiCompatibility(),
    previewPresenter: new KifImportPreviewPresenter()
  }),
  formMapper: new KifImportFormMapper(),
  pastedTextAdapter: new KifPastedTextAdapter()
});
const kifClipboardAdapter = new BrowserKifClipboardAdapter();
const kifImportErrorPresenter = new KifImportErrorPresenter();
const libraryView = new BrowserGameReviewLibraryView();
const libraryPresenter = new GameReviewLibraryPresenter();
const replayView = new BrowserShogiReplayView();
const replayController = new ShogiReplayController({
  parser: kifParser,
  historyBuilder: new PositionHistoryBuilder(),
  replayService: new ShogiReplayApplicationService(),
  viewModel: new ShogiReplayViewModel(),
  view: replayView
});
const keyPositionReplayController = new KeyPositionReplayController({
  addCurrentPosition: new AddCurrentPositionToKeyPosition(),
  formView,
  replayController,
  viewModel: keyPositionReplayViewModel
});
let replayAvailable = false;
let activeReplaySource = null;
const editMapper = new GameReviewEditMapper();
const fileAdapter = new BrowserFileAdapter();
const markdownExportView = new BrowserMarkdownExportView();
const markdownExportController = new MarkdownExportController({
  reviewExporter: new ExportGameReviewAsMarkdown({
    getGameReview,
    formatter: new GameReviewMarkdownFormatter()
  }),
  observationCardExporter: new ExportObservationCardAsMarkdown({
    getGameReview,
    formatter: new ObservationCardMarkdownFormatter()
  }),
  clipboardAdapter: new BrowserClipboardAdapter(),
  fileAdapter
});
let activeMarkdownArtifact = null;
const submitGameReviewForm = new SubmitGameReviewForm({
  mapper: new GameReviewFormMapper(),
  saveGameReview: new SaveGameReview({ repository }),
  persistenceCoordinator
});
const deleteGameReviewAndPersist = new DeleteGameReviewAndPersist({
  deleteGameReview: new DeleteGameReview({ repository }),
  snapshotService,
  persistenceCoordinator
});

function toLocalDateTimeValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function missingItemLabels(items) {
  const labels = {
    KEY_POSITIONS: "重要局面を3件以上記録する",
    OBSERVATION_THEME: "Observation Themeを1件決める",
    ACTION_RULES: "実行Ruleを1件以上決める"
  };
  return items.map((item) => labels[item] ?? item);
}

function showUnexpected(error) {
  console.error(error);
  formView.showFeedback({
    kind: "error",
    title: "処理できませんでした",
    message: error?.message ?? "予期しないErrorが発生しました。",
    details: error?.code ? [error.code] : []
  });
}


function loadReplay(kifuText, {
  sourceFileName = "",
  sourceGameId = formView.readInput().reviewId,
  savedReviewId = null,
  scroll = false
} = {}) {
  const result = replayController.loadKifText(kifuText, { sourceFileName });
  replayAvailable = result.status !== "REJECTED";
  activeReplaySource = replayAvailable ? Object.freeze({
    sourceGameId,
    sourceKifText: String(kifuText ?? ""),
    savedReviewId
  }) : null;
  replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
  if (scroll) replayView.scrollIntoView();
  return result;
}

async function previewKifFile(file) {
  try {
    const result = await kifImportController.selectFile({ file });
    kifImportView.setSelectedSide(formView.readInput().side);
    kifImportView.renderPreview(result.preview);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
  }
}

async function previewKifText(text, { sourceFileName = "clipboard-paste.kifu" } = {}) {
  try {
    const result = await kifImportController.selectText({ text, sourceFileName });
    kifImportView.setSelectedSide(formView.readInput().side);
    kifImportView.renderPreview(result.preview);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
  }
}

function applyPendingKifImport() {
  try {
    const result = kifImportController.applyToForm({
      currentForm: formView.readInput(),
      mySide: kifImportView.getSelectedSide()
    });
    formView.loadInput(result.form);
    replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
    loadReplay(result.form.kifuText, { sourceGameId: result.form.reviewId, scroll: true });
    kifImportView.clearPreview(
      "KIFをFormへ反映しました。まだRepositoryやBrowserには保存されていません。振り返り内容を確認・追記してから保存してください。"
    );
    formView.showFeedback({
      kind: result.warnings.length > 0 ? "warning" : "success",
      title: "KIFをFormへ反映しました",
      message: "Import成功と保存成功は別です。対局の物語・重要局面・Observation Theme・実行Ruleを確認してから保存してください。",
      details: result.warnings.map((item) => `${item.code}: ${item.message}`)
    });
    replayView.scrollIntoView();
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
  }
}

function showReviewDetail(reviewId, { scrollReplay = false } = {}) {
  const found = getGameReview.execute({ reviewId });
  libraryView.renderDetail(libraryPresenter.presentDetail(found.gameReview));
  loadReplay(found.gameReview.kifuText, { sourceGameId: found.gameReview.reviewId, savedReviewId: found.gameReview.reviewId, scroll: scrollReplay });
  return found;
}

function refreshLibrary({ selectedReviewId = null } = {}) {
  const result = listGameReviews.execute();
  const presented = libraryPresenter.presentList(result.gameReviews);
  formView.updateSavedCount(presented.count);
  libraryView.renderList(presented);

  if (selectedReviewId && result.gameReviews.some((item) => item.reviewId === selectedReviewId)) {
    showReviewDetail(selectedReviewId);
  } else {
    libraryView.clearDetail();
    replayAvailable = false;
    activeReplaySource = null;
    replayView.showUnavailable(
      "KIFをFormへ反映するか、保存済み対局を選択すると棋譜を再現できます。"
    );
  }
}

function prepareNewReview() {
  formView.resetForNextReview({
    reviewId: reviewIdGenerator.generate(),
    localDateTimeValue: toLocalDateTimeValue()
  });
  replayAvailable = false;
  activeReplaySource = null;
  replayView.showUnavailable(
    "新しい振り返りです。KIFをImportするか棋譜Textを入力してから再現してください。"
  );
}

function editReview(reviewId) {
  const found = getGameReview.execute({ reviewId });
  formView.loadInput(editMapper.toFormInput(found.gameReview), { replayReferencesAreSaved: true });
  replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
  kifImportView.setSelectedSide(found.gameReview.side);
  showReviewDetail(reviewId);
  formView.showFeedback({
    kind: "info",
    title: "保存済み振り返りを編集します",
    message: `${reviewId}をFormへ読み込みました。同じReview IDの更新として保存されます。`
  });
  document.getElementById("game-review-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showMarkdownArtifact(artifact) {
  activeMarkdownArtifact = artifact;
  markdownExportView.renderArtifact(artifact);
  markdownExportView.scrollIntoView();
  formView.showFeedback({
    kind: "success",
    title: artifact.kind === "OBSERVATION_CARD_MARKDOWN" ? "次局用Observation Cardを作成しました" : "振り返りMarkdownを作成しました",
    message: `${artifact.fileName}をPreviewしています。CopyまたはDownloadしてObsidianへ登録できます。`
  });
}

function previewGameReviewMarkdown(reviewId) {
  showMarkdownArtifact(markdownExportController.createGameReviewMarkdown({ reviewId }));
}

function previewObservationCard(reviewId) {
  showMarkdownArtifact(markdownExportController.createObservationCardMarkdown({ reviewId }));
}

function deleteReview(reviewId) {
  const accepted = window.confirm("この振り返りを削除します。Browser保存まで成功した場合だけ削除を確定します。続けますか？");
  if (!accepted) return;

  const result = deleteGameReviewAndPersist.execute({ reviewId });
  if (result.status === "DELETE_ROLLED_BACK") {
    refreshLibrary({ selectedReviewId: reviewId });
    formView.showFeedback({
      kind: "error",
      title: "削除を確定できませんでした",
      message: result.message,
      details: [result.persistenceErrorCode]
    });
    return;
  }

  if (result.status === "NOT_FOUND") {
    refreshLibrary();
    formView.showFeedback({ kind: "warning", title: "削除対象がありません", message: `${reviewId}はすでに存在しません。` });
    return;
  }

  if (formView.readInput().reviewId === reviewId) prepareNewReview();
  if (activeMarkdownArtifact?.sourceReviewId === reviewId) {
    activeMarkdownArtifact = null;
    markdownExportView.clear();
  }
  refreshLibrary();
  formView.showFeedback({ kind: "success", title: "振り返りを削除しました", message: `${reviewId}をRepositoryとBrowser保存Dataから削除しました。` });
}

formView.initializeKeyPositions();
prepareNewReview();
replayView.setKeyPositionCount(0);
libraryView.clearDetail();
markdownExportView.clear();

try {
  const restored = backupController.loadFromBrowserData();
  refreshLibrary();
  if (restored.status === "RESTORED_FROM_BROWSER") {
    formView.showFeedback({ kind: "success", title: "Browser保存Dataを読み込みました", message: `${restored.count}件の振り返りを復元しました。` });
  }
} catch (error) {
  refreshLibrary();
  showUnexpected(error);
}


document.getElementById("kif-file-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0] ?? null;
  await previewKifFile(file);
  event.target.value = "";
});

const kifDropZone = document.getElementById("kif-drop-zone");
for (const eventName of ["dragenter", "dragover"]) {
  kifDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    kifImportView.setDropActive(true);
  });
}
for (const eventName of ["dragleave", "dragend"]) {
  kifDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    kifImportView.setDropActive(false);
  });
}
kifDropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  kifImportView.setDropActive(false);
  const file = event.dataTransfer?.files?.[0] ?? null;
  await previewKifFile(file);
});
kifDropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    document.getElementById("kif-file-input").click();
  }
});

document.getElementById("preview-kif-paste").addEventListener("click", async () => {
  await previewKifText(kifImportView.getPastedText());
});

document.getElementById("read-kif-clipboard").addEventListener("click", async () => {
  try {
    const text = await kifClipboardAdapter.readText();
    kifImportView.setPastedText(text);
    await previewKifText(text);
  } catch (error) {
    console.error(error);
    kifImportView.showFeedback(kifImportErrorPresenter.present(error));
    kifImportView.focusPastedText();
  }
});

document.getElementById("apply-kif-import")
  .addEventListener("click", () => applyPendingKifImport());

document.getElementById("cancel-kif-import").addEventListener("click", () => {
  const result = kifImportController.cancel();
  kifImportView.clearPreview(
    result.status === "IMPORT_CANCELLED"
      ? "Importを中止しました。現在入力中のFormは変更されていません。"
      : "中止するImport Previewはありません。"
  );
});

document.getElementById("replay-current-form").addEventListener("click", () => {
  const input = formView.readInput();
  loadReplay(input.kifuText, { sourceGameId: input.reviewId, scroll: true });
});

document.getElementById("replay-first").addEventListener("click", () => replayController.first());
document.getElementById("replay-previous").addEventListener("click", () => replayController.previous());
document.getElementById("replay-next").addEventListener("click", () => replayController.next());
document.getElementById("replay-last").addEventListener("click", () => replayController.last());
document.getElementById("replay-flip").addEventListener("click", () => replayController.toggleFlip());

const replayRange = document.getElementById("replay-jump");
const replayNumber = document.getElementById("replay-jump-number");
replayRange.addEventListener("input", () => replayController.jump(Number(replayRange.value)));
document.getElementById("replay-jump-button").addEventListener("click", () => {
  replayController.jump(Number(replayNumber.value));
});
replayNumber.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    replayController.jump(Number(replayNumber.value));
  }
});
document.getElementById("replay-move-list").addEventListener("click", (event) => {
  const moveButton = event.target.closest("[data-jump]");
  if (moveButton) replayController.jump(Number(moveButton.dataset.jump));
});

document.addEventListener("keydown", (event) => {
  if (!replayAvailable || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  ) return;

  const actions = {
    ArrowLeft: () => replayController.previous(),
    ArrowRight: () => replayController.next(),
    Home: () => replayController.first(),
    End: () => replayController.last()
  };
  const action = actions[event.key];
  if (action) {
    event.preventDefault();
    action();
  }
});

document.getElementById("add-current-position").addEventListener("click", () => {
  try {
    if (!activeReplaySource) {
      replayView.showAddResult({ kind: "error", message: "棋譜再現を開始してから追加してください。" });
      return;
    }

    if (
      activeReplaySource.savedReviewId &&
      formView.readInput().reviewId !== activeReplaySource.savedReviewId
    ) {
      const found = getGameReview.execute({ reviewId: activeReplaySource.savedReviewId });
      formView.loadInput(editMapper.toFormInput(found.gameReview), { replayReferencesAreSaved: true });
      formView.showFeedback({
        kind: "info",
        title: "保存済み対局を編集状態へ移しました",
        message: "現在局面はForm候補へ追加されますが、保存ボタンを押すまで保存済みDataは変更されません。"
      });
    }

    const input = formView.readInput();
    const result = keyPositionReplayController.add({
      sourceGameId: input.reviewId,
      sourceKifText: input.kifuText
    });
    replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());

    if (result.status === "REJECTED") {
      replayView.showAddResult({ kind: "error", message: `${result.viewError.message}（${result.viewError.code}）` });
      formView.showFeedback({
        kind: result.duplicateIndex !== undefined ? "warning" : "error",
        title: result.duplicateIndex !== undefined ? "同じ手数の局面があります" : "重要局面候補を追加できません",
        message: result.viewError.message,
        details: [result.viewError.code]
      });
      if (result.duplicateIndex !== undefined) {
        formView.focusKeyPosition(result.duplicateIndex);
      }
      return;
    }

    replayView.showAddResult({
      kind: result.hasWarning ? "warning" : "success",
      message: `${result.moveNumber}手目 ${result.currentMove}を重要局面候補へ追加しました。まだ保存されていません。`
    });
    replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
    formView.showFeedback({
      kind: result.hasWarning ? "warning" : "success",
      title: "現在局面を重要局面候補へ追加しました",
      message: "手数・指し手・局面Snapshotだけを反映しました。FACT・INTERPRETATION・HYPOTHESISは自分の言葉で入力してください。",
      details: result.hasWarning ? ["Replay WarningをSnapshotへ保持しています。"] : []
    });
  } catch (error) {
    showUnexpected(error);
  }
});

document.getElementById("game-review-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = submitGameReviewForm.execute({ input: formView.readInput() });

  if (result.status === "REJECTED") {
    formView.showFeedback({ kind: "error", title: "入力を保存できません", message: result.message, details: [result.errorCode] });
    return;
  }

  refreshLibrary({ selectedReviewId: result.gameReview.reviewId });
  const missing = missingItemLabels(result.gameReview.missingReflectionItems);

  if (result.status === "SAVED_IN_MEMORY_ONLY") {
    formView.showFeedback({
      kind: "warning",
      title: "振り返りはMemoryに保存しました",
      message: "Browserへの永続保存に失敗しました。画面を閉じる前にJSON Backupを作成してください。",
      details: [result.persistenceErrorCode]
    });
    return;
  }

  formView.markReplayReferencesSaved();

  formView.showFeedback({
    kind: result.gameReview.readyForNextGame ? "success" : "warning",
    title: result.saveStatus === "CREATED" ? "振り返りを保存しました" : "振り返りを更新しました",
    message: result.gameReview.readyForNextGame
      ? "次局へ接続できる条件を満たしています。保存済み対局の詳細からObservation Cardを作成できます。"
      : "振り返りDataは保存済みですが、次局へ接続するための項目が残っています。",
    details: missing
  });
});

document.getElementById("add-key-position").addEventListener("click", () => {
  formView.addKeyPosition();
  replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
});
document.getElementById("key-position-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-key-position]");
  if (button) {
    formView.removeKeyPosition(button);
    replayView.setKeyPositionCount(formView.getMeaningfulKeyPositionCount());
  }
});
document.getElementById("new-review").addEventListener("click", () => {
  prepareNewReview();
  activeMarkdownArtifact = null;
  markdownExportView.clear();
  formView.showFeedback({ kind: "info", title: "新しい振り返りを開始しました", message: "未保存の入力内容は画面から消えています。" });
  document.getElementById("game-review-form").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("saved-review-library").addEventListener("click", (event) => {
  const observationCardButton = event.target.closest("[data-preview-observation-card]");
  if (observationCardButton) {
    try { previewObservationCard(observationCardButton.dataset.previewObservationCard); } catch (error) { showUnexpected(error); }
    return;
  }

  const reviewMarkdownButton = event.target.closest("[data-preview-review-markdown]");
  if (reviewMarkdownButton) {
    try { previewGameReviewMarkdown(reviewMarkdownButton.dataset.previewReviewMarkdown); } catch (error) { showUnexpected(error); }
    return;
  }

  const deleteButton = event.target.closest("[data-delete-review]");
  if (deleteButton) {
    try { deleteReview(deleteButton.dataset.deleteReview); } catch (error) { showUnexpected(error); }
    return;
  }

  const replayButton = event.target.closest("[data-replay-review]");
  if (replayButton) {
    try { showReviewDetail(replayButton.dataset.replayReview, { scrollReplay: true }); } catch (error) { showUnexpected(error); }
    return;
  }

  const editButton = event.target.closest("[data-edit-review]");
  if (editButton) {
    try { editReview(editButton.dataset.editReview); } catch (error) { showUnexpected(error); }
    return;
  }

  const viewButton = event.target.closest("[data-view-review]");
  if (viewButton) {
    try { showReviewDetail(viewButton.dataset.viewReview); } catch (error) { showUnexpected(error); }
  }
});

document.getElementById("copy-markdown").addEventListener("click", async () => {
  try {
    const result = await markdownExportController.copy({ artifact: activeMarkdownArtifact });
    formView.showFeedback({ kind: "success", title: "MarkdownをCopyしました", message: `${result.fileName}の内容をClipboardへCopyしました。` });
  } catch (error) { showUnexpected(error); }
});

document.getElementById("download-markdown").addEventListener("click", () => {
  try {
    const result = markdownExportController.download({ artifact: activeMarkdownArtifact });
    formView.showFeedback({ kind: "success", title: ".md FileをDownloadしました", message: `${result.fileName}をObsidian Vaultへ移動できます。` });
  } catch (error) { showUnexpected(error); }
});

document.getElementById("save-browser").addEventListener("click", () => {
  try {
    const result = backupController.saveCurrentDataToBrowser();
    formView.showFeedback({ kind: "success", title: "Browserへ保存しました", message: `${result.byteLength} byteを保存しました。` });
  } catch (error) { showUnexpected(error); }
});

document.getElementById("load-browser").addEventListener("click", () => {
  try {
    const result = backupController.loadFromBrowserData();
    activeMarkdownArtifact = null;
    markdownExportView.clear();
    refreshLibrary();
    formView.showFeedback({
      kind: result.status === "EMPTY" ? "warning" : "success",
      title: result.status === "EMPTY" ? "保存Dataがありません" : "Browser保存Dataを読み込みました",
      message: result.status === "EMPTY" ? "復元対象はありません。" : `${result.count}件を復元しました。`
    });
  } catch (error) { showUnexpected(error); }
});

document.getElementById("download-backup").addEventListener("click", () => {
  try {
    const backup = backupController.createBackupJson();
    fileAdapter.downloadText({ fileName: backup.fileName, text: backup.jsonText });
    formView.showFeedback({ kind: "success", title: "JSON Backupを作成しました", message: `${backup.gameReviewCount}件を出力しました。` });
  } catch (error) { showUnexpected(error); }
});

document.getElementById("restore-backup").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const jsonText = await fileAdapter.readText(file);
    const result = backupController.restoreBackupJson({ jsonText });
    backupController.saveCurrentDataToBrowser();
    activeMarkdownArtifact = null;
    markdownExportView.clear();
    refreshLibrary();
    formView.showFeedback({ kind: "success", title: "JSON Backupを復元しました", message: `${result.count}件をAtomicに復元しました。` });
  } catch (error) {
    showUnexpected(error);
  } finally {
    event.target.value = "";
  }
});

document.getElementById("delete-browser").addEventListener("click", () => {
  const accepted = window.confirm("Browser保存Dataだけを削除します。現在Memory上の振り返りは削除されません。続けますか？");
  if (!accepted) return;
  try {
    backupController.deleteBrowserSavedData();
    formView.showFeedback({ kind: "warning", title: "Browser保存Dataを削除しました", message: "現在Memory上のDataは維持されています。" });
  } catch (error) { showUnexpected(error); }
});
