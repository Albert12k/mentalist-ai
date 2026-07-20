import { Subject } from "../types/Subject";
import { cancelActivityReminders } from "./activityReminders";
import { deleteUserAsset } from "./cloudStorage";
import { deleteLocalMaterial } from "./materials";

// Limpa tudo que pertence à matéria antes de removê-la da lista da conta.
// allSettled garante que um arquivo antigo inválido não impeça os demais.
export async function deleteSubjectData(subject: Subject): Promise<void> {
  await Promise.allSettled([
    deleteUserAsset(subject.imagePath),
    ...subject.materials.flatMap((material) => [
      deleteUserAsset(material.storagePath),
      deleteLocalMaterial(material.uri, material.webStorageKey),
    ]),
    ...subject.events.map((event) => cancelActivityReminders(event.notificationIds)),
  ]);
}
